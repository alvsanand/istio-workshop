# Laboratory 4 - Operating Istio

In the last laboratory, we will explore some advanced features of Istio that provided Istio that will help you while operating a farm om microservces.

We will perform the following task:

1. Create simple Flask microservice.
1. Install in your Minikube cluster.
1. Deploy a sample application.
1. Use a dashboard for Istio.

## 0. Determining the application URL

As in the previous laboratory, we will have to obtain the URL for accesing the application:

1. Obtain host and ports:

    ```shell
    export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="http2")].nodePort}')
    export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="https")].nodePort}')
    export INGRESS_HOST=$(minikube ip)
    export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
    ```

1. Run the following command to retrieve the external address of the Bookinfo application.

    ```shell
    echo http://"$GATEWAY_URL"
    ```

## 1. Deploy simple Flash microservice

Before playing with [Istio Traffic Management features](https://istio.io/latest/docs/tasks/traffic-management/), we will create and deploy in Minikube a very simple HTTP server:

- Download simple-flask repository:

    ```bash
    git clone git@github.com:alvsanand/simple-flask.git
    ```

- Build simple-flask docker image:

    ```bash
    cd simple-flask
    eval $(minikube docker-env)
    docker build -t alvsanand/simple-flask .
    ```

- Download [simple-flask-deployment.yaml](/simple-flask-deployment.yaml) file:

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: simple-flask-v1
    namespace: default
    spec:
    selector:
        matchLabels:
        app: simple-flask
        version: v1
    replicas: 1
    template:
        metadata:
        labels:
            app: simple-flask
            version: v1
        spec:
        containers:
        - name: simple-flask-v1
            image: alvsanand/simple-flask:latest
            imagePullPolicy: Never
            env:
            - name: VERSION
            value: "1.0"
    ---
    apiVersion: apps/v1
    kind: Deployment
    metadata:
    name: simple-flask-v2
    namespace: default
    spec:
    selector:
        matchLabels:
        app: simple-flask
        version: v2
    replicas: 1
    template:
        metadata:
        labels:
            app: simple-flask
            version: v2
        spec:
        containers:
        - name: simple-flask-v1
            image: alvsanand/simple-flask:latest
            imagePullPolicy: Never
            env:
            - name: VERSION
            value: "2.0"
    ---
    apiVersion: v1
    kind: Service
    metadata:
    name: simple-flask
    spec:
    type: ClusterIP
    selector:
        app: simple-flask
    ports:
    - name: http
        port: 80
        targetPort: 8080
    ```

- Deploy `simple-flask-deployment.yaml` file:

    ```bash
    istioctl kube-inject -f simple-flask-deployment.yaml | kubectl apply -f -

## 2. Request Routing

The goal of this exercise is to apply rules that route in all traffic to v1 (version 1) of the microservices in two different ways:

- By default.
- Based on the value of an HTTP request header.

### 2.1. Default routing

Firstly, we will explore [Istio Request Routing](https://istio.io/latest/docs/tasks/traffic-management/request-routing/) routing all traffic of our `simple-flask` to `v1`:

- Download [simple-flask-networking-routing1.yaml](/simple-flask-networking-routing1.yaml) file:

    ```yaml
    apiVersion: networking.istio.io/v1beta1
    kind: Gateway
    metadata:
      name: simple-flask-gateway
    spec:
      selector:
        istio: ingressgateway # use Istio default gateway implementation
      servers:
        - port:
            number: 80
            name: http
            protocol: HTTP
          hosts:
            - "*"
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: DestinationRule
    metadata:
      name: simple-flask
    spec:
      host: simple-flask
      subsets:
        - name: v1
          labels:
            version: v1
        - name: v2
          labels:
            version: v2
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: VirtualService
    metadata:
      name: simple-flask
    spec:
      hosts:
        - "simple-flask.default.svc.cluster.local"
      http:
        - route:
            - destination:
                host: simple-flask
                subset: v1
                port:
                  number: 80
    ```

- Deploy `simple-flask-networking-routing1.yaml` file:

    ```bash
    kubectl apply -f simple-flask-networking-routing1.yaml
    ```

- Test service:

    ```bash
    curl -v http://"$GATEWAY_URL"
    ```

- Delete `simple-flask-networking-routing1.yaml` file:

    ```bash
    kubectl delete -f simple-flask-networking-routing1.yaml
    ```

### 2.1.1 Default routing but to v2

Now, we will modify the VirtualService to route traffic to `v2`:

- Download [simple-flask-networking-routing1.yaml](/simple-flask-networking-routing11.yaml) file:

    ```yaml
    apiVersion: networking.istio.io/v1beta1
    kind: Gateway
    metadata:
      name: simple-flask-gateway
    spec:
      selector:
        istio: ingressgateway # use Istio default gateway implementation
      servers:
        - port:
            number: 80
            name: http
            protocol: HTTP
          hosts:
            - "*"
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: DestinationRule
    metadata:
      name: simple-flask
    spec:
      host: simple-flask
      subsets:
        - name: v1
          labels:
            version: v1
        - name: v2
          labels:
            version: v2
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: VirtualService
    metadata:
      name: simple-flask
    spec:
      hosts:
        - "simple-flask.default.svc.cluster.local"
      http:
        - route:
            - destination:
                host: simple-flask
                subset: v2
                port:
                  number: 80
    ```

- Deploy `simple-flask-networking-routing11.yaml` file:

    ```bash
    kubectl apply -f simple-flask-networking-routing11.yaml
    ```

- Test service:

    ```bash
    curl -v http://"$GATEWAY_URL"
    ```

- Delete `simple-flask-networking-routing11.yaml` file:

    ```bash
    kubectl delete -f simple-flask-networking-routing11.yaml
    ```

### 2.1. Based on the value of an HTTP request header

Finally, we will shift traffic based on the HTTP Header `end-user`:

- Download [simple-flask-networking-routing2.yaml](/simple-flask-networking-routing2.yaml) file:

    ```yaml
    apiVersion: networking.istio.io/v1beta1
    kind: Gateway
    metadata:
      name: simple-flask-gateway
    spec:
      selector:
        istio: ingressgateway # use Istio default gateway implementation
      servers:
        - port:
            number: 80
            name: http
            protocol: HTTP
          hosts:
            - "*"
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: DestinationRule
    metadata:
      name: simple-flask
    spec:
      host: simple-flask
      subsets:
        - name: v1
          labels:
            version: v1
        - name: v2
          labels:
            version: v2
    ---
    apiVersion: networking.istio.io/v1beta1
    kind: VirtualService
    metadata:
      name: simple-flask
    spec:
      hosts:
        - "*"
      gateways:
      - simple-flask-gateway
      http:
        - match:
          - headers:
              end-user:
                exact: user-v1
          route:
            - destination:
                host: simple-flask
                subset: v1
                port:
                  number: 80
        - route:
            - destination:
                host: simple-flask
                subset: v2
                port:
                  number: 80
    ```

- Deploy `simple-flask-networking-routing2.yaml` file:

    ```bash
    kubectl apply -f simple-flask-networking-routing2.yaml
    ```

- Test service:

    ```bash
    curl -v http://"$GATEWAY_URL"
    curl -H 'end-user: user-v1' -v http://"$GATEWAY_URL"
    ```

- Delete `simple-flask-networking-routing2.yaml` file:

    ```bash
    kubectl delete -f simple-flask-networking-routing2.yaml
    ```

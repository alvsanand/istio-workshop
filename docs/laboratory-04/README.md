# Laboratory 4 - Operating Istio

In the last laboratory, we will explore some advanced features of Istio that provided Istio that will help you while operating a farm of microservices.

We will perform the following task:

1. Deploy simple Flash microservice.
1. Route traffic.
1. Circuit breaking when timeout happens.
1. Perform A/B testing.

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

Before playing with [Istio Traffic Management features](https://istio.io/latest/docs/tasks/traffic-management/), we will create and deploy in Minikube a very simple HTTP server. This first iteration will deploy two different version od the app.

To do so, follow these steps: 

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

- Download [simple-flask-deployment.yaml](/simple-flask-deployment.yaml) file.

- Deploy `simple-flask-deployment.yaml` file:

    ```bash
    istioctl kube-inject -f simple-flask-deployment.yaml | kubectl apply -f -
    ```

## 2. Request Routing

The goal of this exercise is to apply rules that route in all traffic to v1 (version 1) of the microservices in two different ways:

- By default.
- Based on the value of an HTTP request header.

### 2.1. Default routing

Firstly, we will explore [Istio Request Routing](https://istio.io/latest/docs/tasks/traffic-management/request-routing/) routing all traffic of our `simple-flask` to `v1`:

- Download [simple-flask-networking-routing1.yaml](/simple-flask-networking-routing1.yaml).

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

- Download [simple-flask-networking-routing1.yaml](/simple-flask-networking-routing11.yaml) file.

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

- Download [simple-flask-networking-routing2.yaml](/simple-flask-networking-routing2.yaml) file.

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

## 3. Circuit breaking

In this exercise, we will explore [Istio Circuit Breaking](https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/) routing and we will be able to route traffic when a service responds very slowly.

The step are:

- Deploy a single simple-flask with 1 second delay.
- Test service with delay.
- Modify networking to return an error when a timeout happens.

### 3.1. Deploy simple-flask with delays

- Download [simple-flask-deployment-circuit.yaml](/simple-flask-deployment-circuit.yaml) file.

- Deploy `simple-flask-deployment-circuit.yaml` file:

    ```bash
    istioctl kube-inject -f simple-flask-deployment-circuit.yaml | kubectl apply -f -
    ```

### 3.2. Route traffic with delays

- Download [simple-flask-networking-circuit1.yaml](/simple-flask-networking-circuit1.yaml) file.

- Deploy `simple-flask-networking-circuit1.yaml` file:

    ```bash
    kubectl apply -f simple-flask-networking-circuit1.yaml
    ```

- Test service:

    ```bash
    curl -v http://"$GATEWAY_URL"
    ```

- Delete `simple-flask-networking-circuit1.yaml` file:

    ```bash
    kubectl delete -f simple-flask-networking-circuit1.yaml
    ```

## 4. Circuit breaking

In the last exercise, we will deploy an A/B testing deployment strategy using [Istio Traffic Shifting](https://istio.io/latest/docs/tasks/traffic-management/traffic-shifting/) routing.

The step are:

- Deploy a simple-flask with 2 different versions.
- Deploy networking for A/B testing based on weights.
- Test service with delay.

### 3.1. Deploy simple-flask

- Download [simple-flask-deployment.yaml](/simple-flask-deployment.yaml) file.

- Deploy `simple-flask-deployment.yaml` file:

    ```bash
    istioctl kube-inject -f simple-flask-deployment.yaml | kubectl apply -f -
    ```

### 3.2.  Deploy networking for A/B testing based on weights

- Download [simple-flask-networking-circuit1.yaml](/simple-flask-networking-circuit1.yaml) file.

- Deploy `simple-flask-networking-circuit1.yaml` file:

    ```bash
    kubectl apply -f simple-flask-networking-traffic-shifting.yaml
    ```

- Test service:

    ```bash
    v1=0
    v2=0
    for i in $(seq 1 100); do
        if $(curl -Ss http://"$GATEWAY_URL" | grep "1.0" > /dev/null 2>&1); then
            v1=$((v1 + 1))
        else
            v2=$((v2 + 1))
        fi
    done

    echo "Responses from V1 = $v1"
    echo "Responses from V2 = $v2"

    ```

- Delete `simple-flask-networking-circuit1.yaml` file:

    ```bash
    kubectl delete -f simple-flask-networking-circuit1.yaml
    ```

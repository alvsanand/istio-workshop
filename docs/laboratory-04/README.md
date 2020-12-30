# Lab 4 - Traffic Management

In the last laboratory, we will explore an advanced feature of Istio called [Traffic Management](https://istio.io/latest/docs/tasks/traffic-management/). Thanks to it, Istio will help you managing the traffic of our microservices very easily.

We will run the following tasks:

1. Deploy a simple Flask microservice.
2. Route traffic to it.
3. Breaks the circuit when timeouts occur.
4. Perform A/B testing.

## 1. Traffic Management

Istio provides a easily way for managing the flow of traffic in an Istio service mesh. The API has allowed users to route requests to specific versions of services, inject delays and failures for resilience testing, add timeouts and circuit breakers, and more, all without changing the application code itself.

![Traffic Management diagram](https://istio.io/latest/blog/2018/v1alpha3-routing/virtualservices-destrules.svg)

The most important Istio configuration resources to control traffic routing into are

- **Gateway**: it configures a load balancer for HTTP/TCP traffic, regardless of where it will be running. Any number of gateways can exist within the mesh and multiple different gateway implementations can co-exist.
- **VirtualService**: it describes the mapping between one or more user-addressable destinations to the actual destination workloads inside the mesh. This can be particularly useful in facilitating turning monoliths into a composite service built out of distinct microservices without requiring the consumers of the service to adapt to the transition.
- **DestinationRule**: a DestinationRule configures the set of policies to be applied while forwarding traffic to a service. They are intended to be authored by service owners, describing the circuit breakers, load balancer settings, TLS settings, etc.. DestinationRule is more or less the same as its predecessor, DestinationPolicy.
- **ServiceEntry**: it is used to add additional entries into the service registry that Istio maintains internally. It is most commonly used to allow one to model traffic to external dependencies of the mesh such as APIs consumed from the web or traffic to services in legacy infrastructure.

VirtualService, DestinationRule, and ServiceEntry replace RouteRule, DestinationPolicy, and EgressRule respectively. The Gateway is a platform independent abstraction to model the traffic flowing into dedicated middle-boxes.

## 2. Determining the application URL

As in previous laboratories, firstly we will have to obtain the URL for accessing our application:

1. Obtain host and ports:

    ```sh
    export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="http2")].nodePort}')
    export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="https")].nodePort}')
    export INGRESS_HOST=$(minikube ip)
    export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
    ```

2. Run the following command to retrieve the external address of the application.

    ```sh
    echo http://"$GATEWAY_URL"
    ```

## 3. Deploying simple-flask microservice

Before playing with [Istio Traffic Management features](https://istio.io/latest/docs/tasks/traffic-management/), we will create and deploy in Minikube a very simple HTTP server. This first iteration will deploy two different version of a very simple HTTP server.

To do so, follow these steps:

- Download simple-flask repository:

    ```sh
    git clone git@github.com:alvsanand/simple-flask.git
    ```

- Build simple-flask docker image:

    ```sh
    cd simple-flask
    eval $(minikube docker-env)
    docker build -t alvsanand/simple-flask .
    ```

- Deploy [simple-flask-deployment.yaml](../simple-flask-deployment.yaml) file:

    ```sh
    istioctl kube-inject -f simple-flask-deployment.yaml | kubectl apply -f -
    ```

## 4. Routing requests

The goal of this exercise is to apply rules that route requests to different versions of our simple-flask in two different ways:

- By default.
- Based on the value of an HTTP request header.

### 4.1. Default routing

Firstly, we will explore [Istio Request Routing](https://istio.io/latest/docs/tasks/traffic-management/request-routing/) routing all traffic of our `simple-flask` to `v1`:

<<< @/docs/.vuepress/public/simple-flask-networking-routing1.yaml

- Deploy [simple-flask-networking-routing1.yaml](../simple-flask-networking-routing1.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-routing1.yaml

- Test the service:

    ```sh
    curl -v http://"$GATEWAY_URL"
    ```

    It should return something like:

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 200 OK
    < content-type: text/html; charset=utf-8
    < content-length: 28
    < server: istio-envoy
    < date: Wed, 30 Dec 2020 08:31:35 GMT
    < x-envoy-upstream-service-time: 20
    < 
    * Connection #0 to host 192.168.49.2 left intact
    Helloworld from Flask[1.0]!!
    ```

- Delete `simple-flask-networking-routing1.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-routing1.yaml
    ```

### 4.1.1 Default routing but to v2

Now, we will modify the VirtualService to route traffic to `v2`:

```yaml
...
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
    - route:
        - destination:
            host: simple-flask
            subset: v2
            port:
              number: 80
```

- Deploy [simple-flask-networking-routing1.yaml](../simple-flask-networking-routing11.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-routing11.yaml
    ```

- Test the service:

    ```sh
    curl -v http://"$GATEWAY_URL"
    ```

    It should return something like:

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 200 OK
    < content-type: text/html; charset=utf-8
    < content-length: 28
    < server: istio-envoy
    < date: Wed, 30 Dec 2020 08:35:38 GMT
    < x-envoy-upstream-service-time: 58
    < 
    * Connection #0 to host 192.168.49.2 left intact
    Helloworld from Flask[2.0]!!
    ```

- Delete `simple-flask-networking-routing11.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-routing11.yaml
    ```

### 4.2. Based on the value of an HTTP request header

Finally, we will shift traffic based on the HTTP Header `end-user`:

```yaml
...
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

- Deploy [simple-flask-networking-routing2.yaml](../simple-flask-networking-routing2.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-routing2.yaml
    ```

- Test the service:

    ```sh
    curl -v http://"$GATEWAY_URL"
    curl -H 'end-user: user-v1' -v http://"$GATEWAY_URL"
    ```

    It should return something like:

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 200 OK
    < content-type: text/html; charset=utf-8
    < content-length: 28
    < server: istio-envoy
    < date: Wed, 30 Dec 2020 08:36:58 GMT
    < x-envoy-upstream-service-time: 13
    < 
    * Connection #0 to host 192.168.49.2 left intact
    Helloworld from Flask[2.0]!!
    ```

    and

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > end-user: user-v1
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 200 OK
    < content-type: text/html; charset=utf-8
    < content-length: 28
    < server: istio-envoy
    < date: Wed, 30 Dec 2020 08:36:58 GMT
    < x-envoy-upstream-service-time: 83
    < 
    * Connection #0 to host 192.168.49.2 left intact
    Helloworld from Flask[1.0]!!
    ```

- Delete `simple-flask-networking-routing2.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-routing2.yaml
    ```

## 5. Circuit breaking

In this exercise, we will explore [Istio Circuit Breaking](https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/) routing so we will be able to route traffic when a service responds very slowly.

The steps are:

- Deploy a single simple-flask with 1 second delay.
- Test the service with delay.
- Modify networking to return an error when a timeout happens.
- Test the service with circuit-breaking.

In Istio, managing timeouts for specific request is as simple as adding `timeout` parameter to the `VirtualService`:

```yaml
...
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
    - route:
        - destination:
            host: simple-flask
            port:
              number: 80
      timeout: 100ms
```

### 5.1. Deploy simple-flask with delays

- Deploy [simple-flask-deployment-circuit.yaml](../simple-flask-deployment-circuit.yaml) file:

    ```sh
    istioctl kube-inject -f simple-flask-deployment-circuit.yaml | kubectl apply -f -
    ```

### 5.2. Route traffic with delays

- Deploy [simple-flask-networking-circuit1.yaml](../simple-flask-networking-circuit1.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-circuit1.yaml
    ```

- Test the service:

    ```sh
    curl -v http://"$GATEWAY_URL"
    ```

    It should return something like after several seconds:

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 200 OK
    < content-type: text/html; charset=utf-8
    < content-length: 34
    < server: istio-envoy
    < date: Wed, 30 Dec 2020 08:38:40 GMT
    < x-envoy-upstream-service-time: 5055
    < 
    * Connection #0 to host 192.168.49.2 left intact
    Helloworld from Flask[1.0-DELAY]!!
    ```

- Delete `simple-flask-networking-circuit1.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-circuit1.yaml
    ```

### 5.3. Route traffic with Circuit Breaking enabled

- Deploy [simple-flask-networking-circuit2.yaml](../simple-flask-networking-circuit2.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-circuit2.yaml
    ```

- Test the service:

    ```sh
    curl -v http://"$GATEWAY_URL"
    ```

    It should return something like:

    ```sh
    *   Trying 192.168.49.2:32028...
    * TCP_NODELAY set
    * Connected to 192.168.49.2 (192.168.49.2) port 32028 (#0)
    > GET / HTTP/1.1
    > Host: 192.168.49.2:32028
    > User-Agent: curl/7.68.0
    > Accept: */*
    > 
    * Mark bundle as not supporting multiuse
    < HTTP/1.1 408 Request Timeout
    < content-length: 27
    < content-type: text/plain
    < date: Wed, 30 Dec 2020 08:40:11 GMT
    < server: istio-envoy
    < 
    * Connection #0 to host 192.168.49.2 left intact
    downstream duration timeout
    ```

- Delete `simple-flask-networking-circuit1.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-circuit1.yaml
    ```

## 6. Traffic shifting

In the last exercise, we will deploy an A/B testing deployment strategy using [Istio Traffic Shifting](https://istio.io/latest/docs/tasks/traffic-management/traffic-shifting/) routing.

The step are:

- Deploy a simple-flask with 2 different versions.
- Deploy networking for A/B testing based on weights.
- Test the service with delay.

In order to make this happen, we must just modify our VirtualService adding two different routes:

```yaml
...
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
    - route:
        - destination:
            host: simple-flask
            port:
                number: 80
            subset: v1
            weight: 80
        - destination:
            host: simple-flask
            port:
                number: 80
            subset: v2
            weight: 20
```

### 7.1. A/B tests

- Deploy [simple-flask-deployment.yaml](../simple-flask-deployment.yaml) file:

    ```sh
    istioctl kube-inject -f simple-flask-deployment.yaml | kubectl apply -f -
    ```

### 7.2. Deploy networking for A/B testing based on weights

- Deploy [simple-flask-networking-circuit1.yaml](../simple-flask-networking-circuit1.yaml) file:

    ```sh
    kubectl apply -f simple-flask-networking-traffic-shifting.yaml
    ```

### 7.3 Test and check the proportional traffic among versions

- Test the service:

    ```sh
    v1=0
    v2=0
    for i in $(seq 1 500); do
        if $(curl -Ss http://"$GATEWAY_URL" | grep "1.0" > /dev/null 2>&1); then
            v1=$((v1 + 1))
        else
            v2=$((v2 + 1))
        fi
    done

    echo "Responses from V1 = $v1"
    echo "Responses from V2 = $v2"

    ```

    It should return numbers like:

    ```sh
    Responses from V1 = 405
    Responses from V2 = 95
    ```

    This numbers are an approximation of 80% and 20% of the total requests. So they may vary.

- Delete `simple-flask-networking-circuit1.yaml` resources:

    ```sh
    kubectl delete -f simple-flask-networking-circuit1.yaml
    ```

<br />
<br />

::: tip You finish it!!!

You have reached the end of **Istio Workshop**. I hope that you have enjoyed doing it and now you have a good overview of [Service Mesh](https://www.redhat.com/en/topics/microservices/what-is-a-service-mesh) and [Istio](https://istio.io/). For sure, you are more confident in being able to use it in your new developments.

*Thanks dude!*

![Thanks dude](./img/you_got_it_dude.gif)
:::

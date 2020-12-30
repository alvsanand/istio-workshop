# Lab 2 - Installing Istio

In the second laboratory of the workshop, we will install and configure Istio as in its [getting-started](https://istio.io/latest/docs/setup/getting-started/) tutorial.

We will perform the following task:

1. Download Istio in your laptop.
2. Install in your Minikube cluster.
3. Deploy a sample application.
4. Use a dashboard for Istio.

## 1. Downloading Istio

1. Execute Istio downloader:

    ```sh
    curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.8.1 sh -
    ```

2. Move to the Istio package directory:

    ```sh
    cd istio-1.8.1
    ```

3. Add the `istioctl` client to your path (Linux or macOS):

    ```sh
    export PATH=$PWD/bin:$PATH
    ```

## 2. Installing Istio in Minikube

1. For this installation, we use the `demo` [configuration profile](https://istio.io/latestdocs/setup/additional-setup/config-profiles/).

    ```sh
    istioctl install --set profile=demo
    ```

2. (Optional) Add a namespace label to instruct Istio to automatically inject Envoy sidecar proxies when you deploy your application later:

    ```sh
    kubectl label namespace default istio-injection=enabled
    ```

## 3. Deploying a sample application

1. Deploy the [Bookinfo sample application](https://istio.io/latest/docs/examples/bookinfo/):

    ```sh
    kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
    ```

2. The application will start. As each pod becomes ready, the Istio sidecar will deploy along with it.

    ```sh
    kubectl get services
    ```

    and

    ```sh
    kubectl get pods
    ```

3. Verify everything is working correctly up to this point. Run this command to see if the app is running inside the cluster and serving HTML pages by     checking for the page title in the response:

    ```sh
    kubectl exec "$(kubectl get pod -l app=ratings -o jsonpath='{.items[0].metadata.name}')" -c ratings -- curl -s productpage:9080/productpage | grep -o "<title>.*</title>"
    ```

### 3.1 Opening sample application to outside traffic

The Bookinfo application is deployed but not accessible from the outside. To make it accessible, you need to create an [Istio Ingress Gateway](https://istio.io/latestdocs/concepts/traffic-management/#gateways), which maps a path to a route at the edge of your mesh.

1. Associate this application with the Istio gateway:

    ```sh
    kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml
    ```

2. Ensure that there are no issues with the configuration:

    ```sh
    istioctl analyze
    ```

### 3.2 Determining the ingress IP and ports

Follow these instructions to set the `INGRESS_HOST` and `INGRESS_PORT` variables for accessing the gateway. Use the tabs to choose the instructions for your chosen platform:

1. Set the ingress ports:

    ```sh
    export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="http2")].nodePort}')
    export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(.name=="https")].nodePort}')
    ```

2. Ensure a port was successfully assigned to each environment variable:

    ```sh
    echo "$INGRESS_PORT"
    echo "$SECURE_INGRESS_PORT"
    ```

3. Set the ingress IP:

    ```sh
    export INGRESS_HOST=$(minikube ip)
    ```

4. Ensure an IP address was successfully assigned to the environment variable:

    ```sh
    echo "$INGRESS_HOST"
    ```

5. Run this command in a **new terminal window** to start a Minikube tunnel that sends traffic to your Istio Ingress Gateway:

    ```sh
    minikube tunnel
    ```

6. Set `GATEWAY_URL`:

    ```sh
    export GATEWAY_URL=$INGRESS_HOST:$INGRESS_PORT
    ```

7. Run the following command to retrieve the external address of the Bookinfo application.

    ```sh
    echo http://"$GATEWAY_URL/productpage"
    ```

8. Paste the output from the previous command into your web browser and confirm that the Bookinfo product page is displayed.

## 4. Managing Istio using a dashboard

Istio has several optional dashboards installed by the demo installation. The [Kiali](https://kiali.io/) dashboard helps you understand the structure of your service mesh by displaying the topology and indicates the health of your mesh.

1. Install `Kiali` and the other addons and wait for them to be deployed.

    ```sh
    kubectl apply -f samples/addons
    kubectl rollout status deployment/kiali -n istio-system
    ```

2. Access the Kiali dashboard. The default user name is `admin` and default password is `admin`.

    ```sh
    istioctl dashboard kiali
    ```

3. In the left navigation menu, select _Graph_ and in the _Namespace_ drop down, select _default_.

    The Kiali dashboard shows an overview of your mesh with the relationships between the services in the `Bookinfo` sample application. It also provides filters to visualize the traffic flow.

    ![Kiali Dashboard](https://istio.io/latest/docs/setup/getting-started/kiali-example2.png)
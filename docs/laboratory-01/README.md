# Laboratory 1 - Installing Minkube

The first laboratory of the workshop consist of launching a Kubernetes cluster in our local machine. In order to achieve that, we will use [minikube](https://kubernetes.io/docs/tutorials/hello-minikube/) that eases a lot this task.

We will perform the following task:

1. Install and run a Minikube cluster in your laptop.
1. Use `kubectl` while deploying a sample application.
1. Deploy a sample application.
1. Install and use Helm.

### Requirements

- 2 CPUs or more
- 8GB of free memory
- 40GB of free disk space
- Internet connection
- Container or virtual machine manager, such as: [Docker](https://docs.docker.com/engine/install/).

## 1. Installing Minikube

Depending of your OS, you will have different options for installing Minilube.

### Linux

```shell
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo mv minikube-linux-amd64 /usr/local/bin/minikube
```

### MacOs

If the [Brew Package Manager](https://brew.sh/) installed:

```shell
brew install minikube
```

If `which minikube` fails after installation via brew, you may have to remove the minikube cask and link the binary:

```shell
brew cask remove minikube
brew link minikube
```

Otherwise, download minikube directly:

```shell
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

### Windows

If the [Chocolatey Package Manager](https://chocolatey.org/) is installed, use it to install minikube:

```shell
choco install minikube
```

Otherwise, download and run the [Windows installer](https://storage.googleapis.com/minikube/releases/latest/minikube-installer.exe)

## 2. Starting the cluster

From a terminal with administrator access (but not logged in as root), run:

```shell
minikube start --cpus 2 --memory 8192 --disk-size 40g
```

## 3. Interacting with K8s

If you already have kubectl installed, you can now use it to access your shiny new cluster:

```shell
kubectl config use-context minikube
kubectl get po -A
```

Alternatively, minikube can download the appropriate version of kubectl, if you don't mind the double-dashes in the command-line:

```shell
minikube kubectl -- get po -A
```

minikube bundles the Kubernetes Dashboard, allowing you to get easily acclimated to your new environment:

```shell
minikube dashboard
```

## 4. Deploying a sample application

Create a sample deployment and expose it on port 8080:

```shell
kubectl create deployment hello-minikube --image=k8s.gcr.io/echoserver:1.4
kubectl expose deployment hello-minikube --type=NodePort --port=8080
```

It may take a moment, but your deployment will soon show up when you run:

```shell
kubectl get services hello-minikube
```

The easiest way to access this service is to let minikube launch a web browser for you:

```shell
minikube service hello-minikube
```

Alternatively, use kubectl to forward the port:

```shell
kubectl port-forward service/hello-minikube 7080:8080
```

Now, the application is available at [http://localhost:7080/](http://localhost:7080/)

## 5. Deleting minikube cluster

> For now, we will not execute this command.

```shell
minikube delete --all
```

## 6. Installing Helm

```shell
curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
```

## 7. Deploying a simple Chart

- Deploy a MySQL server:

    ```shell
    helm repo update
    helm install my_mysql stable/mysql
    ```

- Check its status:

    ```shell
    helm status my_mysql
    ```

- Delete the chart:

    ```shell
    helm uninstall my_mysql
    ```

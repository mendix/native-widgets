FROM mcr.microsoft.com/dotnet/runtime:8.0
ARG MENDIX_VERSION

RUN \
    echo "Installing Java..." && \
    apt-get -qq update && \
    apt-get -qq install -y wget libgdiplus && \
    wget -q https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz -O /tmp/openjdk.tar.gz && \
    mkdir /usr/lib/jvm && \
    tar xfz /tmp/openjdk.tar.gz --directory /usr/lib/jvm && \
    rm /tmp/openjdk.tar.gz 
RUN \
    echo "Downloading mxbuild ${MENDIX_VERSION}..." && \
    wget -q https://cdn.mendix.com/runtime/mxbuild-${MENDIX_VERSION}.tar.gz -O /tmp/mxbuild.tar.gz && \
    mkdir /tmp/mxbuild && \
    tar xfz /tmp/mxbuild.tar.gz --directory /tmp/mxbuild && \
    rm /tmp/mxbuild.tar.gz 
RUN \
    apt-get -qq remove -y wget && \
    apt-get clean 
RUN \
    echo "#!/bin/bash -x" >/bin/mxbuild && \
    echo "dotnet /tmp/mxbuild/modeler/mxbuild.dll --java-home=/usr/lib/jvm/jdk-11.0.2 --java-exe-path=/usr/lib/jvm/jdk-11.0.2/bin/java \$@" >>/bin/mxbuild && \
    chmod +x /bin/mxbuild 
RUN \
    echo "#!/bin/bash -x" >/bin/mx && \
    echo "dotnet /tmp/mxbuild/modeler/mx.dll \$@" >>/bin/mx && \
    chmod +x /bin/mx
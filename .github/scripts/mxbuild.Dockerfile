FROM mcr.microsoft.com/dotnet/runtime:8.0
ARG MENDIX_VERSION

RUN \
    echo "Installing Java 17..." && \
    apt-get -qq update && \
    apt-get -qq install -y wget libgdiplus && \
    wget -q https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_linux-x64_bin.tar.gz -O /tmp/openjdk.tar.gz && \
    mkdir -p /usr/lib/jvm && \
    tar xfz /tmp/openjdk.tar.gz --directory /usr/lib/jvm && \
    mv /usr/lib/jvm/jdk-17.0.2 /usr/lib/jvm/java-17-openjdk && \
    rm /tmp/openjdk.tar.gz  

RUN \
    echo "Downloading mxbuild ${MENDIX_VERSION}..." && \
    wget -q https://appdev-ci.rnd.mendix.com/job/AppStudio5.0-Build/48897/artifact/artifacts/mxbuild-10.16.0.48897.tar.gz -O /tmp/mxbuild.tar.gz && \
    mkdir /tmp/mxbuild && \
    tar xfz /tmp/mxbuild.tar.gz --directory /tmp/mxbuild && \
    rm /tmp/mxbuild.tar.gz 

RUN \
    apt-get -qq remove -y wget && \
    apt-get clean 

RUN \
    echo "#!/bin/bash -x" >/bin/mxbuild && \
    echo "dotnet /tmp/mxbuild/modeler/mxbuild.dll --java-home=/usr/lib/jvm/java-17-openjdk --java-exe-path=/usr/lib/jvm/java-17-openjdk/bin/java \$@" >>/bin/mxbuild && \
    chmod +x /bin/mxbuild  

RUN \
    echo "#!/bin/bash -x" >/bin/mx && \
    echo "dotnet /tmp/mxbuild/modeler/mx.dll \$@" >>/bin/mx && \
    chmod +x /bin/mx

ENV M2EE_TOOLS_JAR=/tmp/mxbuild/modeler/tools/m2ee-tools.jar
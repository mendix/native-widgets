FROM mcr.microsoft.com/dotnet/runtime:8.0
ARG MENDIX_VERSION

RUN \
    echo "Installing required packages..." && \
    apt-get -qq update && \
    apt-get -qq install -y wget libgdiplus openjdk-21-jdk

RUN \
    echo "Downloading mxbuild ${MENDIX_VERSION}..." && \
    wget -q https://cdn.mendix.com/runtime/mxbuild-${MENDIX_VERSION}.tar.gz -O /tmp/mxbuild.tar.gz || { echo "Failed to download mxbuild"; exit 1; } && \
    mkdir /tmp/mxbuild && \
    tar xfz /tmp/mxbuild.tar.gz --directory /tmp/mxbuild || { echo "Failed to extract mxbuild"; exit 1; } && \
    rm /tmp/mxbuild.tar.gz

RUN \
    apt-get -qq remove -y wget && \
    apt-get clean

RUN \
    echo "#!/bin/bash -x" >/bin/mxbuild && \
    echo "dotnet /tmp/mxbuild/modeler/mxbuild.dll --java-home=/usr/lib/jvm/java-21-openjdk --java-exe-path=/usr/lib/jvm/java-21-openjdk/bin/java \$@" >>/bin/mxbuild && \
    chmod +x /bin/mxbuild

RUN \
    echo "#!/bin/bash -x" >/bin/mx && \
    echo "dotnet /tmp/mxbuild/modeler/mx.dll \$@" >>/bin/mx && \
    chmod +x /bin/mx

ENV M2EE_TOOLS_JAR=/tmp/mxbuild/modeler/tools/m2ee-tools.jar
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk
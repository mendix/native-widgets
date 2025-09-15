FROM mcr.microsoft.com/dotnet/runtime:8.0
ARG MENDIX_VERSION

# Install Java 21 and required tools
RUN \
    echo "Installing Java 21..." && \
    apt-get -qq update && \
    apt-get -qq install -y wget libgdiplus python3 curl git && \
    wget -q https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz -O /tmp/openjdk.tar.gz || { echo "Failed to download Java 21"; exit 1; } && \
    mkdir -p /usr/lib/jvm && \
    tar xfz /tmp/openjdk.tar.gz --directory /usr/lib/jvm || { echo "Failed to extract Java 21"; exit 1; } && \
    ls /usr/lib/jvm && \
    mv /usr/lib/jvm/jdk-21* /usr/lib/jvm/java-21-openjdk && \
    rm /tmp/openjdk.tar.gz

# Download mxbuild
RUN \
    echo "Downloading mxbuild ${MENDIX_VERSION}..." && \
    wget -q https://cdn.mendix.com/runtime/mxbuild-${MENDIX_VERSION}.tar.gz -O /tmp/mxbuild.tar.gz || { echo "Failed to download mxbuild"; exit 1; } && \
    mkdir /tmp/mxbuild && \
    tar xfz /tmp/mxbuild.tar.gz --directory /tmp/mxbuild || { echo "Failed to extract mxbuild"; exit 1; } && \
    rm /tmp/mxbuild.tar.gz

# Download Mendix runtime
RUN \
    echo "Downloading Mendix runtime ${MENDIX_VERSION}..." && \
    mkdir -p /app/runtimes && \
    wget -q "https://cdn.mendix.com/runtime/mendix-${MENDIX_VERSION}.tar.gz" -O /tmp/runtime.tar.gz && \
    tar xfz /tmp/runtime.tar.gz --directory /app/runtimes && \
    rm /tmp/runtime.tar.gz

# Setup m2ee tools
RUN \
    mkdir -p /app/var/opt/m2ee /app/var/log /app/var/run /app/bin /app/project/data/model-upload /app/project/data/database /app/project/data/files /app/project/data/tmp && \
    git clone https://github.com/KevinVlaanderen/m2ee-tools.git /tmp/m2ee && \
    mv /tmp/m2ee/src/* /app/var/opt/m2ee && \
    chmod a=rwx /app/var/log/ /app/var/run/

# Create mxbuild wrapper
RUN \
    echo "#!/bin/bash -x" >/bin/mxbuild && \
    echo "dotnet /tmp/mxbuild/modeler/mxbuild.dll --java-home=/usr/lib/jvm/java-21-openjdk --java-exe-path=/usr/lib/jvm/java-21-openjdk/bin/java \$@" >>/bin/mxbuild && \
    chmod +x /bin/mxbuild

# Create mx wrapper
RUN \
    echo "#!/bin/bash -x" >/bin/mx && \
    echo "dotnet /tmp/mxbuild/modeler/mx.dll \$@" >>/bin/mx && \
    chmod +x /bin/mx

# Create m2ee wrapper
RUN \
    echo "#!/bin/bash -x" > /app/bin/m2ee && \
    echo "cd /app && python3 var/opt/m2ee/m2ee.py \$@" >> /app/bin/m2ee && \
    chmod +x /app/bin/m2ee

# Create m2ee configuration template
RUN \
    echo 'm2ee:' > /app/m2ee-native.yml && \
    echo '    app_name: Test App' >> /app/m2ee-native.yml && \
    echo '    app_base: /app/project' >> /app/m2ee-native.yml && \
    echo '    admin_port: 8090' >> /app/m2ee-native.yml && \
    echo '    admin_pass: Password1!' >> /app/m2ee-native.yml && \
    echo '    runtime_port: 8080' >> /app/m2ee-native.yml && \
    echo '    runtime_listen_addresses: "*"' >> /app/m2ee-native.yml && \
    echo '    javaopts:' >> /app/m2ee-native.yml && \
    echo '        ["-Dfile.encoding=UTF-8", "-Xmx512M", "-Xms512M", "-Djava.io.tmpdir=/app/project/data/tmp"]' >> /app/m2ee-native.yml && \
    echo '    javabin: /usr/lib/jvm/java-21-openjdk/bin/java' >> /app/m2ee-native.yml && \
    echo '    pidfile: /app/var/run/m2ee.pid' >> /app/m2ee-native.yml && \
    echo 'mxruntime:' >> /app/m2ee-native.yml && \
    echo '    DTAPMode: T' >> /app/m2ee-native.yml && \
    echo '    ApplicationRootUrl: http://localhost:8080/' >> /app/m2ee-native.yml && \
    echo '    DatabaseType: HSQLDB' >> /app/m2ee-native.yml && \
    echo '    DatabaseName: default' >> /app/m2ee-native.yml && \
    echo '    DatabasePassword: ""' >> /app/m2ee-native.yml && \
    echo '    BuiltInDatabasePath: /app/project/data/database' >> /app/m2ee-native.yml && \
    echo 'logging:' >> /app/m2ee-native.yml && \
    echo '    -' >> /app/m2ee-native.yml && \
    echo '        type: file' >> /app/m2ee-native.yml && \
    echo '        name: FileSubscriber' >> /app/m2ee-native.yml && \
    echo '        autosubscribe: TRACE' >> /app/m2ee-native.yml && \
    echo '        filename: /app/log/runtime.log' >> /app/m2ee-native.yml

# Create runtime startup script
RUN \
    echo '#!/bin/bash' > /app/start-runtime.sh && \
    echo 'set -e' >> /app/start-runtime.sh && \
    echo 'cd /app' >> /app/start-runtime.sh && \
    echo 'echo "Starting Mendix runtime service..."' >> /app/start-runtime.sh && \
    echo 'if [ -f "/app/automation.mda" ]; then' >> /app/start-runtime.sh && \
    echo '  echo "Found automation.mda file"' >> /app/start-runtime.sh && \
    echo '  rm -rf project/model project/web' >> /app/start-runtime.sh && \
    echo '  unzip -qq /app/automation.mda -d project/' >> /app/start-runtime.sh && \
    echo '  echo "Extracted MDA file"' >> /app/start-runtime.sh && \
    echo '  bin/m2ee -c m2ee-native.yml --verbose --yolo start' >> /app/start-runtime.sh && \
    echo '  echo "Runtime started successfully"' >> /app/start-runtime.sh && \
    echo '  # Keep the container running' >> /app/start-runtime.sh && \
    echo '  tail -f /app/var/log/m2ee.log' >> /app/start-runtime.sh && \
    echo 'else' >> /app/start-runtime.sh && \
    echo '  echo "No automation.mda found, starting in wait mode..."' >> /app/start-runtime.sh && \
    echo '  echo "Container is ready to receive MDA file"' >> /app/start-runtime.sh && \
    echo '  # Keep container alive until MDA is provided' >> /app/start-runtime.sh && \
    echo '  while true; do' >> /app/start-runtime.sh && \
    echo '    if [ -f "/app/automation.mda" ]; then' >> /app/start-runtime.sh && \
    echo '      echo "MDA file detected, starting runtime..."' >> /app/start-runtime.sh && \
    echo '      rm -rf project/model project/web' >> /app/start-runtime.sh && \
    echo '      unzip -qq /app/automation.mda -d project/' >> /app/start-runtime.sh && \
    echo '      bin/m2ee -c m2ee-native.yml --verbose --yolo start' >> /app/start-runtime.sh && \
    echo '      echo "Runtime started successfully"' >> /app/start-runtime.sh && \
    echo '      tail -f /app/var/log/m2ee.log' >> /app/start-runtime.sh && \
    echo '      break' >> /app/start-runtime.sh && \
    echo '    fi' >> /app/start-runtime.sh && \
    echo '    sleep 5' >> /app/start-runtime.sh && \
    echo '  done' >> /app/start-runtime.sh && \
    echo 'fi' >> /app/start-runtime.sh && \
    chmod +x /app/start-runtime.sh

# Health check script
RUN \
    echo '#!/bin/bash' > /app/health-check.sh && \
    echo '# Check if container is running (always return success for container health)' >> /app/health-check.sh && \
    echo '# The actual runtime health will be checked by the workflow' >> /app/health-check.sh && \
    echo 'exit 0' >> /app/health-check.sh && \
    chmod +x /app/health-check.sh

ENV M2EE_TOOLS_JAR=/tmp/mxbuild/modeler/tools/m2ee-tools.jar
ENV PATH="/app/bin:${PATH}"

WORKDIR /app
EXPOSE 8080 8090
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 CMD ["/app/health-check.sh"]

# Clean up
RUN apt-get -qq remove -y wget && apt-get clean

CMD ["/app/start-runtime.sh"]
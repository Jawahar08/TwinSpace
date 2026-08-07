# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx256m -Xms64m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Djava.awt.headless=true"

# Copy context and dynamically locate pom.xml and src
COPY . /tmp/context/
RUN if [ -f /tmp/context/backend/springboot-api/pom.xml ]; then \
      cp /tmp/context/backend/springboot-api/pom.xml ./pom.xml && \
      cp -r /tmp/context/backend/springboot-api/src ./src; \
    elif [ -f /tmp/context/pom.xml ]; then \
      cp /tmp/context/pom.xml ./pom.xml && \
      cp -r /tmp/context/src ./src; \
    else \
      echo "Error: pom.xml not found in context!" && exit 1; \
    fi

# Build minimal production jar without tests
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -B

# Stage 2: Runtime stage with dynamic PORT binding
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080 10000
ENTRYPOINT ["sh", "-c", "java -Xmx192m -Xms64m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar app.jar"]



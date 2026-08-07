# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx256m -Xms64m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Djava.awt.headless=true"

# Copy Maven POM and source
COPY backend/springboot-api/pom.xml ./pom.xml
COPY backend/springboot-api/src ./src

# Build minimal production jar without tests
RUN mvn clean package -DskipTests -Dmaven.test.skip=true --quiet

# Stage 2: Runtime stage with dynamic PORT binding
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080 10000
ENTRYPOINT ["sh", "-c", "java -Xmx192m -Xms64m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -Xss256k -XX:+UseSerialGC -Dserver.port=${PORT:-8080} -jar app.jar"]


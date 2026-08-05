# Stage 1: Build stage (Optimized for 512MB RAM limit)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx256m"

# Copy Maven POM and download dependencies
COPY backend/springboot-api/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B

# Copy Spring Boot backend source code
COPY backend/springboot-api/src ./src

# Package Application skipping tests for production container
RUN mvn package -DskipTests -Dmaven.test.skip=true

# Stage 2: Runtime stage (Memory capped for Render Free Tier 512MB RAM)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENV JAVA_OPTS="-Xmx256m -Xms128m -XX:+UseSerialGC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# Build Stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy Maven POM and download dependencies
COPY backend/springboot-api/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B

# Copy Spring Boot backend source code
COPY backend/springboot-api/src ./src

# Package Application
RUN mvn package -DskipTests

# Runtime Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]

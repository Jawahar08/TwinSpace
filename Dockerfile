# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY backend/springboot-api/pom.xml ./pom.xml
RUN mvn dependency:go-offline -B -f pom.xml

COPY backend/springboot-api/src ./src
RUN mvn package -DskipTests -f pom.xml

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]

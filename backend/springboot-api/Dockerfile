# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy full build context to temporary location and locate pom.xml/src regardless of root directory setting
COPY . /tmp/source/
RUN if [ -f /tmp/source/backend/springboot-api/pom.xml ]; then \
      cp /tmp/source/backend/springboot-api/pom.xml ./pom.xml && \
      cp -r /tmp/source/backend/springboot-api/src ./src; \
    else \
      cp /tmp/source/pom.xml ./pom.xml && \
      cp -r /tmp/source/src ./src; \
    fi

RUN mvn package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-jar", "app.jar"]

# Stage 1: Ultra-compact build stage (Capped strictly for 512MB Render RAM limit)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx128m -XX:MaxMetaspaceSize=128m"

# Copy Maven POM and source
COPY backend/springboot-api/pom.xml ./pom.xml
COPY backend/springboot-api/src ./src

# Build minimal production jar without tests
RUN mvn clean package -DskipTests -Dmaven.test.skip=true --quiet

# Stage 2: Ultra-compact runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/springboot-api-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENV JAVA_OPTS="-Xmx192m -Xms64m -XX:+UseSerialGC -XX:MaxMetaspaceSize=96m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

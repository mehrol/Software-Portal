# Use Eclipse Temurin JDK for building
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copy Maven/Gradle files first to leverage caching
COPY mvnw* pom.xml ./
COPY .mvn .mvn
COPY src src

# Build the jar (if using Maven)
RUN ./mvnw clean package -DskipTests

# Runtime image
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy built jar
COPY --from=build /app/target/*.jar app.jar

# Expose backend port
EXPOSE 8082

# Run
ENTRYPOINT ["java", "-jar", "app.jar"]

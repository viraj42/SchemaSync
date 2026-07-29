# Build Stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy maven wrapper and pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Make the wrapper executable (fixes Windows line ending/permission issues)
RUN chmod +x ./mvnw

# Download dependencies (this step will be cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline

# Copy source code and build the application
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the default port (Render automatically maps the $PORT environment variable)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

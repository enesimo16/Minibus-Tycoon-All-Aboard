FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/FullFilled.Api/FullFilled.Api.csproj backend/FullFilled.Api/
RUN dotnet restore backend/FullFilled.Api/FullFilled.Api.csproj

COPY backend/FullFilled.Api/ backend/FullFilled.Api/
COPY shared/ shared/
RUN dotnet publish backend/FullFilled.Api/FullFilled.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
COPY --from=build /src/shared ./shared

ENTRYPOINT ["dotnet", "FullFilled.Api.dll"]

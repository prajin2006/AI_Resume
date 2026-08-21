import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    reload = os.environ.get("ENV", "development").lower() != "production"
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)

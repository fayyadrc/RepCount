import os
import httpx

def keep_alive_ping():
    """
    Pings the backend's own public URL (or a custom PING_URL)
    to prevent Render's free tier instance from sleeping.
    """
    # Render automatically sets RENDER_EXTERNAL_URL for web services.
    # Alternatively, the user can configure a custom PING_URL.
    ping_url = os.getenv("PING_URL") or os.getenv("RENDER_EXTERNAL_URL")
    
    if not ping_url:
        print("ℹ️ Neither PING_URL nor RENDER_EXTERNAL_URL is set. Skipping keep-alive ping.")
        return

    # Ensure we target the health endpoint
    if not any(path in ping_url for path in ["/api/health", "/health"]):
        ping_url = f"{ping_url.rstrip('/')}/api/health"

    print(f"📡 Sending keep-alive ping to {ping_url}...")
    try:
        # Use a reasonable timeout (e.g., 10 seconds) to avoid hanging
        response = httpx.get(ping_url, timeout=10.0)
        if response.status_code == 200:
            print(f"✅ Keep-alive ping successful: {response.status_code}")
        else:
            print(f"⚠️ Keep-alive ping returned status: {response.status_code}")
    except httpx.RequestError as exc:
        print(f"❌ Keep-alive ping failed: An error occurred while requesting {exc.request.url!r}.")
    except Exception as exc:
        print(f"❌ Keep-alive ping failed: {exc}")

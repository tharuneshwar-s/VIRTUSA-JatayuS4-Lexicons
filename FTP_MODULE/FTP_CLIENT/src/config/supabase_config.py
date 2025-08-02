"""
Supabase Configuration
"""

from supabase import create_client, Client, ClientOptions
import supabase.version as __version__

from . import (
    ConfigDefaults,
    validate_required_env_vars,
    get_env_var,
    safe_str,
)


# Validate required Supabase environment variables
required_vars = validate_required_env_vars("SUPABASE_URL", "SUPABASE_ANON_KEY")

SUPABASE_URL = required_vars["SUPABASE_URL"]
SUPABASE_KEY = required_vars["SUPABASE_ANON_KEY"]

# Optional service key
SUPABASE_SERVICE_KEY = get_env_var("SUPABASE_ROLE_KEY")

# Schema configuration
SUPABASE_SCHEMA = get_env_var(
    "SUPABASE_SCHEMA",
    ConfigDefaults.SUPABASE_SCHEMA,
    lambda x: safe_str(x, ConfigDefaults.SUPABASE_SCHEMA),
)

# Configure client options for better concurrency handling
client_options: ClientOptions = ClientOptions(
    schema=SUPABASE_SCHEMA,
    headers={"X-Client-Info": f"supabase-py/{__version__.__version__}"},
)

# Create Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=client_options)

# Create service role client only if service key is provided
supabase_role: Client = None
if SUPABASE_SERVICE_KEY:
    supabase_role = create_client(
        SUPABASE_URL, SUPABASE_SERVICE_KEY, options=client_options
    )

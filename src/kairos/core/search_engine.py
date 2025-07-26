import os 
from serpapi import GoogleSearch
from dotenv import load_dotenv
load_dotenv()


def search_web(query: str, num_results: int = 3) -> str:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise ValueError("SERPAPI_API_KEY is not set in the environment variables.")
    
    search = GoogleSearch({
        "q": query,
        "num": num_results,
        "api_key": api_key
    })
    results = search.get_dict()

    """ simple resume of the title and link """

    output = []
    for result in results.get("organic_results", []):
        title = result.get("title", "No title")
        link = result.get("link", "No link")
        if title and link:
         output.append(f"{title} - {link}")

    return "\n".join(output) if output else "No results found."
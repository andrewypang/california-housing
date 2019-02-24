import requests
from requests.auth import HTTPBasicAuth

apikey = "42518e77865b671d0fe762fdf3151be2209dd058"
request_url = "http://citysdk.commerce.gov"

request_obj = {
  'state': 'CA',
  'level': 'county',
  'sublevel': False,
  'api': 'acs5',
  'year': 2017,
}

response = requests.post(request_url, auth=HTTPBasicAuth(apikey, None), json=request_obj)

print(response.json())
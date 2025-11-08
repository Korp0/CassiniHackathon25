
# pip install requests matplotlib tifffile numpy

import requests
from io import BytesIO
import matplotlib.pyplot as plt
import tifffile
import numpy as np

lon = 21.260107
lat = 48.709314

import requests

url = "https://sh.dataspace.copernicus.eu/api/v1/process"
headers = {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYVUh3VWZKaHVDVWo0X3k4ZF8xM0hxWXBYMFdwdDd2anhob2FPLUxzREZFIn0.eyJleHAiOjE3NjI2MTU2NjIsImlhdCI6MTc2MjYxMzg2MiwiYXV0aF90aW1lIjoxNzYyNjAxMDkxLCJqdGkiOiI4MjA1OTA4Ni0xNzY3LTRjYjctYTcyNC1hYzEzYjlkNzlkMGIiLCJpc3MiOiJodHRwczovL2lkZW50aXR5LmRhdGFzcGFjZS5jb3Blcm5pY3VzLmV1L2F1dGgvcmVhbG1zL0NEU0UiLCJzdWIiOiJmYzY3ZTUxMC05ZGM1LTRmZWQtOTUxMy01YWQxOTlkNDI2MTUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzaC0yZDA3NzkxNy1lZTZlLTQyOGUtODZiZC1lZjNmOWVlNGUyZTEiLCJub25jZSI6Imk5cVpOYkNmUXd4blo0clhFV01SSW43THVOcllRYno0ODRjWXB5cDJkTjQiLCJzZXNzaW9uX3N0YXRlIjoiYjE2NDVjODAtY2RjYi00ZTU4LWIwMDMtMzIxY2U1NjEzMTgzIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vc2hhcHBzLmRhdGFzcGFjZS5jb3Blcm5pY3VzLmV1Il0sInNjb3BlIjoib3BlbmlkIGVtYWlsIHByb2ZpbGUgdXNlci1jb250ZXh0Iiwic2lkIjoiYjE2NDVjODAtY2RjYi00ZTU4LWIwMDMtMzIxY2U1NjEzMTgzIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm9yZ2FuaXphdGlvbnMiOlsiZGVmYXVsdC1mYzY3ZTUxMC05ZGM1LTRmZWQtOTUxMy01YWQxOTlkNDI2MTUiXSwibmFtZSI6IllhcmlrIFRzYXJ5ayIsInVzZXJfY29udGV4dF9pZCI6ImMxMTRmOTUzLTUwZmEtNDE2Ny05OTJlLTZjNzExZDZkOTk4NCIsImNvbnRleHRfcm9sZXMiOnt9LCJjb250ZXh0X2dyb3VwcyI6WyIvYWNjZXNzX2dyb3Vwcy91c2VyX3R5cG9sb2d5L2NvcGVybmljdXNfZ2VuZXJhbC8iLCIvb3JnYW5pemF0aW9ucy9kZWZhdWx0LWZjNjdlNTEwLTlkYzUtNGZlZC05NTEzLTVhZDE5OWQ0MjYxNS9yZWd1bGFyX3VzZXIvIl0sInByZWZlcnJlZF91c2VybmFtZSI6InlhcmlrdHMzM0BnbWFpbC5jb20iLCJnaXZlbl9uYW1lIjoiWWFyaWsiLCJ1c2VyX2NvbnRleHQiOiJkZWZhdWx0LWZjNjdlNTEwLTlkYzUtNGZlZC05NTEzLTVhZDE5OWQ0MjYxNSIsImZhbWlseV9uYW1lIjoiVHNhcnlrIiwiZW1haWwiOiJ5YXJpa3RzMzNAZ21haWwuY29tIn0.aoUsLQdzTZeVzF_LRXhYgwRz1EXPVaZGWd1bfvTuakJ237HIR6YSitDfQUvtywNlWJaSb5RXXv5CJmgasqP8lOLIOuK5KCPaE50spwUewOdE5CEbWM1JWB3F3cGilnmftZYcy0E5lp65vO8AxxuGv9RgvnuCF13lTnvWXlQnyPxyVUdKqYppNyE8MErQ76lS_D2DRgHvnxsbpAYdTmTZzPiCTDC3lgOkshSt6WtD6jom2r5MnvnkFlyCi-yxHodEwzPfJFt8G-Ii4wHohXTeAm5oKL0DImk-WbavSdi7KZhFdbkw0Ryb_DqGYOKioJk-EAFbRjXH5ASB1-XxI-iiCQ"
}
data = {
  "input": {
    "bounds": {
      "bbox": [
        lon,
        lat,
        lon+0.000001,
        lat+0.000001
      ]
    },
    "data": [
      {
        "dataFilter": {
          "timeRange": {
            "from": "2025-11-07T00:00:00Z",
            "to": "2025-11-07T23:59:59Z"
          }
        },
        "type": "sentinel-5p-l2"
      }
    ]
  },
  "output": {
    "width": 500,
    "height": 241.542,
    "responses": [
      {
        "identifier": "default",
        "format": {
          "type": "image/tiff"
        }
      }
    ]
  },
  "evalscript": "//VERSION=3\n\nfunction setup() {\n  return {\n    input: [\"NO2\", \"dataMask\"],\n    output: {\n      bands: 4\n    }\n  }\n}\n\nvar viz = ColorRampVisualizer.createBlueRed(0, 0.0001);\n\nfunction evaluatePixel(samples) {\n  let ret = viz.process(samples.NO2);\n  ret.push(samples.dataMask);\n  return ret;\n}\n"
}

response = requests.post(url, headers=headers, json=data)

print(response.status_code)



tiff_data = BytesIO(response.content)
img_array = tifffile.imread(tiff_data)

red_channel = img_array[:, :, 0]

center_y = red_channel.shape[0] // 2
center_x = red_channel.shape[1] // 2

pixel_value = np.mean(red_channel)

print(pixel_value)

if pixel_value < 128:
  quality = "air is clear"
elif pixel_value < 191:
  quality = "air is slightly dirty"
elif pixel_value < 255:
  quality = "air is dirty"
else:
  quality = "air is very dirty"

print(quality)

plt.figure(figsize=(12, 8))
plt.imshow(img_array[:, :, 0])
plt.colorbar(label='NO2 concentration')
plt.title('Sentinel-5P NO2 Data')
plt.show()







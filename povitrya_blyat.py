
# pip install requests matplotlib tifffile numpy

import requests
from io import BytesIO
import matplotlib.pyplot as plt
import tifffile
import numpy as np

lon = 21.260107
lat = 48.709314

url_T = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

data = {
    "client_id": "cdse-public",
    "grant_type": "password",
    "username": "yarikts33@gmail.com", 
    "password": "51192005Az@."     
}

response_T = requests.post(url_T, data=data)
token = response_T.json()["access_token"]

url = "https://sh.dataspace.copernicus.eu/api/v1/process"
headers = {
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
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








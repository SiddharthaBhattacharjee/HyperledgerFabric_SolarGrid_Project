import requests
import time
import random

# Defined the URL where your Express app is running
url = 'http://host.docker.internal:3001/receiveData' #url to send data

while True:
    chk = random.randint(0,4)
    if chk==1:
        val1 = random.randint(-72,80)
        val2 = -val1
        data_to_send = {'org1': val1, 'org2': val2, 'ss_key': 'ogteg0eykrk'}
    else:
        val1 = random.randint(-78,80)
        data_to_send = {'org1': val1, 'org2': 0, 'ss_key': 'ogteg0eykrk'}

    try:
        # Make the POST request
        timeout_ = random.randint(8,14)
        response = requests.post(url, json=data_to_send)

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            print(f'Data sent {data_to_send}',flush=True)
        else:
            print(f'Error sending data. Status code: {response.status_code} Error: {response.text}',flush=True)
        time.sleep(timeout_)
    except requests.RequestException as e:
        print(f'Error sending data: {e}',flush=True)

import requests
import time
import random
from base64 import b64decode
from Crypto.Cipher import AES
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
import base64

# Defined the URL where your Express app is running
url_ = 'http://host.docker.internal:3001/receiveData' #url to send data
url_auth = 'http://host.docker.internal:3001/authenticate' #URL for authentication

auth_status = False
session_key = False

# Reading the public key
with open("./Gateway_publicKey.txt", "rb") as pb:
    pubKeyObj = RSA.importKey(pb.read())

# Reading the private key
with open("./Org2_privateKey.txt", "rb") as pb:
    privKeyObj = RSA.importKey(pb.read())

# takes message to be encrypted, RSA public key object -> returns encrypted binary    
def custom_encrypt(msg,pub_key_obj):
    cipher = PKCS1_OAEP.new(pub_key_obj)
    emsg = cipher.encrypt(msg.encode())
    return emsg

# takes encrypted message to be decrypted, RSA private key object -> returns decrypted string
def custom_decrypt(emsg,priv_key_obj):
    cipher = PKCS1_OAEP.new(priv_key_obj)
    plainText = cipher.decrypt(emsg).decode()
    return plainText

# @DeprecationWarning
# def decrypt(encrypted, key, iv):
#     encoded = b64decode(encrypted)
#     key_bytes = key.encode('utf-8')  # Encode the key as bytes
#     iv_bytes = iv.encode('utf-8')
#     dec = AES.new(key=key_bytes, mode=AES.MODE_CBC, IV=iv_bytes)
#     value = dec.decrypt(encoded)
#     value = str(value)
#     value = value.split('\\')
#     value = value[0]
#     value = value.split("'")
#     value = value[1]
#     return value

# with open('./org1pk.txt', 'r') as file:
#     pk = file.read()
    
#iv_ = "spw0h26cl8gt68kh"

while True:
    while not auth_status:
        auth_response = requests.post(url_auth, json={'org_id':'org2'})
        if auth_response.status_code == 200:
            session_key = auth_response.content
            # session_key = decrypt(session_key,pk,iv_)
            session_key = custom_decrypt(auth_response.content,privKeyObj)
            auth_status = True
            print(f"Authentication Successful, Auth Key: {session_key}",flush=True) #remove auth key after testing
        else:
            print(f"Authentication Failure, Status: {auth_response.status} Error: {auth_response.text}",flush=True)
        time.sleep(5)

    if auth_status:
        chk = random.randint(0,4)
        if chk==1:
            val1 = random.randint(-72,80)
            val2 = -val1
            data_to_send = f'{{"org1": {val2}, "org2": {val1}, "ss_key": "{session_key}", "sender":"Org2"}}'
        else:
            val1 = random.randint(-78,80)
            data_to_send = f'{{"org1": 0, "org2": {val1}, "ss_key": "{session_key}", "sender":"Org2"}}'

        try:
            #encrypt the data
            emsg = custom_encrypt(data_to_send,pubKeyObj)
            data_ = base64.b64encode(emsg)
            # Make the POST request
            headers = {'Content-Type': 'application/octet-stream'}
            timeout_ = random.randint(8,14)
            res = requests.post(url=url_, data=emsg, headers=headers)

            # Check if the request was successful (status code 200)
            if res.status_code == 200:
                session_key = custom_decrypt(res.content,privKeyObj)
                print(f'Data sent {data_to_send} , renewed ssk: {session_key}',flush=True)
            else:
                print(f'Error sending data. Status code: {res.status_code} Error: {res.text}',flush=True)
            time.sleep(timeout_)
        except requests.RequestException as e:
            print(f'Error sending data: {e}',flush=True)

from dotenv import load_dotenv
import os
load_dotenv(r'F:\bug\BugBot\backend\app\.env')
print('MONGO_URI set:', bool(os.getenv('MONGO_URI')))
print('MONGO_DB_NAME:', repr(os.getenv('MONGO_DB_NAME')))
print('XAI_API_KEY set:', bool(os.getenv('XAI_API_KEY')))
import unittest
import json
from queries import final_queries
import sys
import os
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app 
from FakerData import generate_data


class TestAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.app = app.test_client()
        cls.log_ids = []

    def test_ingest_log(self):
        log_data = {
            "level": "error",
            "message": "Test error log",
            "resourceId": "test-123",
            "timestamp": "2023-11-20T08:00:00Z",
            "traceId": "abc-test-123",
            "spanId": "span-789",
            "commit": "5e5342f",
            "metadata": {
                "parentResourceId": "parent-test-123"
            }
        }

        # Post the log data to the API endpoint
        response = self.app.post('/api/v1/logs/', json=log_data)
        data = json.loads(response.data.decode('utf-8'))

        self.log_ids.append(data['response']['_id'])
    
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Data pushed to Elasticsearch successfully')

    def test_ingest_logs(self):
        gen_data = generate_data(10)
        for log_data in gen_data:
            response = self.app.post('/api/v1/logs/', json=log_data)
            data = json.loads(response.data.decode('utf-8'))
            self.log_ids.append(data['response']['_id'])

    def test_query_logs(self):
        for query, page, size in final_queries:
            response = self.app.get(f'/api/v1/logs/?q={query}')
            data = json.loads(response.data.decode('utf-8'))
            self.assertEqual(response.status_code, 200)
            self.assertTrue(isinstance(data, list)) 

    def test_query_with_pagination(self):
        for query, page, size in final_queries:
            response = self.app.get(f'/api/v1/logs/?q={query}&page={page}&size={size}')
            data = json.loads(response.data.decode('utf-8'))
            self.assertEqual(response.status_code, 200)
            self.assertTrue(isinstance(data, list)) 

    def test_query_log_by_id(self):
        log_id = self.log_ids[0]
        response = self.app.get(f'/api/v1/logs/{log_id}')
        data = json.loads(response.data.decode('utf-8'))
        
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(data)  
    

    def test_successful_deletion(self):
        for log_id in self.log_ids:
            # Send a DELETE request to delete the log by ID
            response = self.app.delete(f'/api/v1/logs/{log_id}')
            data = json.loads(response.data.decode('utf-8'))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(data['message'], 'Log deleted successfully')

        for log_id in self.log_ids:
            response = self.app.get(f'/api/v1/logs/{log_id}')
            data = json.loads(response.data.decode('utf-8'))
            self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()

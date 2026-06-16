import unittest
import json
from unittest.mock import patch, MagicMock
from app import app, fetch_and_parse_feed

class BigQueryReleasesAppTestCase(unittest.TestCase):
    
    def setUp(self):
        # Configure the Flask app test client
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_index_route_status_and_template(self):
        """Regression test to check if the main HTML dashboard route is active and serves proper layout elements."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
        # Verify body contains crucial structural HTML blocks
        html_content = response.data.decode('utf-8')
        
        # Verify Search inputs and Controls
        self.assertIn('id="search-input"', html_content)
        self.assertIn('id="sort-select"', html_content)
        self.assertIn('id="refresh-btn"', html_content)
        
        # Verify newly added "Export to CSV" button
        self.assertIn('id="export-csv-btn"', html_content)
        
        # Verify newly added "Theme Switch Checkbox" and Label
        self.assertIn('id="theme-checkbox"', html_content)
        self.assertIn('class="theme-switch-container"', html_content)
        self.assertIn('class="theme-label"', html_content)
        
        # Verify dynamic listing container and modal overlays
        self.assertIn('id="releases-grid"', html_content)
        self.assertIn('id="floating-bar"', html_content)
        self.assertIn('id="tweet-modal"', html_content)
        self.assertIn('id="toast"', html_content)

    def test_api_releases_route_success(self):
        """Integration test to verify that the release feed API responds with correct JSON structures and live notes."""
        response = self.client.get('/api/releases')
        self.assertEqual(response.status_code, 200)
        
        # Parse output JSON
        data = json.loads(response.data.decode('utf-8'))
        
        # Check standard feed variables
        self.assertTrue(data['success'])
        self.assertIn('feed_title', data)
        self.assertIn('updated', data)
        self.assertIn('entries', data)
        
        # Verify elements inside entries list (if any notes exist)
        entries = data['entries']
        self.assertIsInstance(entries, list)
        
        if len(entries) > 0:
            first_entry = entries[0]
            self.assertIn('id', first_entry)
            self.assertIn('title', first_entry)
            self.assertIn('updated', first_entry)
            self.assertIn('link', first_entry)
            self.assertIn('content', first_entry)
            
            # Verify structured headers inside content
            self.assertTrue(
                '<h3>' in first_entry['content'] or first_entry['content'] == '', 
                "Content should follow structured HTML representation"
            )

    @patch('urllib.request.urlopen')
    def test_api_releases_route_failure_handling(self, mock_urlopen):
        """Regression test verifying that backend network exceptions are caught and return a clean 500 JSON error."""
        # Setup mock exception
        mock_urlopen.side_effect = Exception("Connection timed out to feed source")
        
        response = self.client.get('/api/releases')
        self.assertEqual(response.status_code, 500)
        
        # Parse error payload
        data = json.loads(response.data.decode('utf-8'))
        self.assertFalse(data['success'])
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Connection timed out to feed source")

if __name__ == '__main__':
    unittest.main()

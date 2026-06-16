import os
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# BigQuery Release Notes Atom Feed URL
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Create a request with a User-Agent to avoid getting blocked
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            # Extract basic Atom entry elements
            entry_id = entry.find('atom:id', ns)
            title = entry.find('atom:title', ns)
            updated = entry.find('atom:updated', ns)
            content = entry.find('atom:content', ns)
            
            # Link element can be handled by attributes
            link_elem = entry.find('atom:link', ns)
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            entries.append({
                'id': entry_id.text if entry_id is not None else '',
                'title': title.text if title is not None else 'Release Update',
                'updated': updated.text if updated is not None else '',
                'link': link,
                'content': content.text if content is not None else ''
            })
            
        return {
            'success': True,
            'feed_title': root.find('atom:title', ns).text if root.find('atom:title', ns) is not None else 'BigQuery Release Notes',
            'updated': root.find('atom:updated', ns).text if root.find('atom:updated', ns) is not None else '',
            'entries': entries
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    result = fetch_and_parse_feed()
    if result['success']:
        return jsonify(result)
    else:
        return jsonify(result), 500

if __name__ == '__main__':
    # Get port from environment, default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

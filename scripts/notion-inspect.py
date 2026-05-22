import json
d = json.load(open('/tmp/notion-tasks.json'))
print('Total returned:', len(d['results']), 'has_more:', d.get('has_more'))
for r in d['results']:
    title = ''.join(t.get('plain_text', '') for t in r['properties']['Name']['title'])
    proj_rel = r['properties'].get('项目', {}).get('relation', [])
    archive = r['properties'].get('Archive', {}).get('checkbox')
    print('  -', repr(title), '| project_ids=', [p['id'] for p in proj_rel], '| archive=', archive)

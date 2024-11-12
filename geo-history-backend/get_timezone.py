import sys
import json
from timezonefinder import TimezoneFinder

# Check if the command-line argument is provided
if len(sys.argv) > 1:
    try:
        # Read from the file specified in the command-line argument
        with open(sys.argv[1], 'r') as file:
            content = file.read()
            if not content:
                raise ValueError("File is empty")

            data = json.loads(content)

            if not isinstance(data, list):
                raise ValueError("Input should be a list of locations")

            tf = TimezoneFinder()
            results = []

            for location in data:
                latitude = location.get('latitude')
                longitude = location.get('longitude')

                if latitude is None or longitude is None:
                    results.append({"error": "Invalid input: Missing latitude or longitude"})
                else:
                    timezone = tf.timezone_at(lat=latitude, lng=longitude)
                    if timezone:
                        results.append({"timezone": timezone})
                    else:
                        results.append({"error": "Timezone not found"})

            print(json.dumps(results))

    except (json.JSONDecodeError, ValueError) as e:
        print(json.dumps({"error": f"JSON decode error or invalid data: {str(e)}"}))
else:
    print(json.dumps({"error": "No input provided"}))

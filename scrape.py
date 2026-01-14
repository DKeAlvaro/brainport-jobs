import requests
import json
import time

def download_brainport_jobs():
    base_url = "https://brainporteindhoven.com/en/discover-brainport/work/current-tech-it-vacancies-in-brainport-eindhoven"
    
    params = {
        "tx_brainportjobs_joblist[action]": "list",
        "tx_brainportjobs_joblist[controller]": "JobAjax",
        "type": "1594717109",
        "cHash": "8d5dd4d6a85579669ba415290168cc20",
        "tx_brainportjobs_jobslist[pageLimit]": "15",
        "tx_brainportjobs_jobslist[location_filter][]": "5",
        "tx_brainportjobs_jobslist[language_filter]": "en"
    }

    all_jobs = []
    page = 1
    
    print("Starting download...")

    while True:
        params["tx_brainportjobs_jobslist[page]"] = page
        
        try:
            response = requests.get(base_url, params=params)
            response.raise_for_status() # Check for HTTP errors
            
            data = response.json()
            jobs_in_page = data.get('jobs', [])

            if not jobs_in_page:
                print(f"No more jobs found at page {page}. Finishing.")
                break

            for job in jobs_in_page:
                raw_date = job.get('date', {})
                date_str = ""
                if isinstance(raw_date, dict):
                    date_str = raw_date.get('date', '').split(' ')[0]
                elif isinstance(raw_date, str):
                    date_str = raw_date.split(' ')[0]

                locations = job.get('locations', {})
                province = locations.get('4', '')
                region = locations.get('5', '')

                description = job.get('description', '')
                if description:
                    description = " ".join(description.split())

                cleaned_job = {
                    "title": job.get('title'),
                    "company": job.get('company'),
                    "location": job.get('location_name'),
                    "province": province,
                    "region": region,
                    "date": date_str,
                    "language": job.get('language'),
                    "featured": job.get('featured'),
                    "url": job.get('uri'),
                    "description": description
                }
                all_jobs.append(cleaned_job)

            print(f"Downloaded and processed page {page} ({len(jobs_in_page)} jobs). Total: {len(all_jobs)}")
            
            page += 1
            
            time.sleep(0.5)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching page {page}: {e}")
            break
        except json.JSONDecodeError:
            print("Failed to decode JSON. The server might have blocked the request or changed the format.")
            break

    output_path = "jobs.json"
    output_data = {
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "jobs": all_jobs
    }

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
        print(f"\nSuccess! Total jobs saved: {len(all_jobs)}")
        print(f"File saved as: {output_path}")
    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    download_brainport_jobs()
# **Automated Recruitment System**

## **Project Objective**

The objective of this project is to build an automated recruitment system that streamlines the complete hiring process, starting from job posting and candidate application through CV screening, shortlisting, interview scheduling, interview evaluation, and final hiring communication.

The overall process will follow this flow:

* **HR Creates Job**
* **Job Published**
* **Candidate Applies / Sends CV via Email**
* **CV Collection**
* **CV Extraction**
* **ATS Scoring**
* **Shortlisting**
* **Interview Scheduling**
* **Interview Evaluation**
* **Hiring Decision**
* **Email Notification**

# **Project Requirements**

## **Job Posting and Candidate Application**

* **The frontend will provide an interface for HR to create and publish job vacancies.**
* **HR will be able to enter the job title, job description, required skills, experience, qualifications, and other relevant information.**
* **Once published, the job will have an Apply option where candidates can submit their personal information and upload their CV.**
* **Candidates will also be able to submit their CV directly through the designated recruitment email.**

## **CV Collection and Screening**

* **CVs received through the application form and recruitment email will be collected automatically.**
* **The backend automation will process the received CVs, extract relevant candidate information, and structure the data.**
* **The extracted information will include:**

  * **Contact information**
  * **Education**
  * **Skills**
  * **Work experience**
  * **Qualifications**
  * **Other relevant candidate information**
* **The extracted candidate data will then be stored in the designated data storage system.**
* **The AI-based screening process will compare each candidate's information against the corresponding Job Description and generate an ATS score based on the overall job match.**
* **Candidates meeting or exceeding the defined ATS threshold will proceed to the shortlisting stage, while candidates below the threshold will receive an automated rejection notification.**

## **Interview Scheduling**

* **Shortlisted candidates will automatically receive a congratulations email.**
* **The email will provide available interview dates and time slots. Once the candidate selects a preferred slot, the selected date and time will automatically be recorded in the recruitment calendar.**
* **An interview invitation will also be sent to the candidate with the relevant interview details.**

## **Interview Evaluation and Final Decision**

* **After the interview, HR or the interviewer will enter the candidate's interview score into the system.**
* **The interview score will be evaluated against the predefined hiring threshold.**
* **Candidates who meet the required threshold will be considered for final selection and will receive a hiring confirmation email.**
* **Candidates who do not meet the required threshold will receive an automated rejection email.**

## **Frontend Development Scope**

The frontend will provide the user-facing interfaces required for the recruitment process, including:

* **Job Posting**
* **Job publishing**
* **Candidate application form**
* **candidate Scoring**
* **Shortlisted Candidate**
* **Interview Evaluation**

## **Backend Automation Scope**

The backend automation will be implemented using n8n workflows. Based on the current requirements, four core workflows will be required:

## **Workflow 1: CV Collection, Extraction and ATS Scoring**

This workflow will collect CVs from the application system and recruitment email, extract candidate information, store the structured data, compare the candidate against the relevant Job Description, and generate the ATS score.

## **Workflow 2: Shortlist and Interview Communication**

This workflow will handle communication with shortlisted candidates. It will send the shortlist/congratulations email, provide available interview slots, and manage the candidate's interview slot selection.

## **Workflow 3: Interview Invitation and Calendar Scheduling**

This workflow will process the selected interview date and time, add the appointment to the recruitment calendar, and send the formal interview invitation to the candidate.

## **Workflow 4: Final Hiring Decision and Feedback Email**

This workflow will process the final interview score and hiring decision. Based on the defined threshold, it will send either a final selection/hiring confirmation email or a rejection/feedback email to the candidate.

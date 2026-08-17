// 1. Define an interface matching the expected JSON structure
interface PostData {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export async function fetchData(url:string): Promise<void> {
  try {
    // Note: Typicode.com root usually returns HTML. 
    // Use 'https://typicode.com' to get valid JSON matching the interface.
    const response: Response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // 2. Cast the parsed JSON into your predefined interface type
    const data = await response.json() as PostData;
    console.log(data.title); // TypeScript now knows exactly what properties exist here
    
  } catch (error: unknown) {
    // 3. Narrow the type of 'error' because TypeScript treats it as 'unknown'
    if (error instanceof Error) {
      console.error('Fetch error:', error.message);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}


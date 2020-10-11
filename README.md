LEARNING TO REBUILD REACT (most basic implementation of React)
calling it ReHackt.

KEY INGREDIENTS TO BUILDING REACT!
- createElement function = This allows users to define a React/Rehackt element. 
- the container gets a node from the DOM, aka the "root" from the index.html file id. 
- render function = allows users to render/display the React/Rehackt element in the dom/container.
- Implementing useState/useEffect/setState for hook functionality. 

MAIN DIFFERENCES BETWEEN REHACKT & REACT!!
- In a real React Application, you will be able to see the "workLoop", "performUnitOfWork", and "updateFunctionComponent".
- ReHackt is walking through the whole tree utilizing the fibers created to walk through instead of Linked Lists.
- When ReHackt receives a new update during its render phase, it'll throw away the current "work-in-progress" and
start again from the root.  React tags each update with a timestamp and uses that timestamp to determine which update has a 
higher priority. (priority queue'ing).


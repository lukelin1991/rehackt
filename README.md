LEARNING TO REBUILD REACT (most basic implementation of React)
calling it ReHackt.

KEY INGREDIENTS TO BUILDING REACT!
- createElement function = This allows users to define a React/Rehackt element. 
- the container gets a node from the DOM, aka the "root" from the index.html file id. 
- render function = allows users to render/display the React/Rehackt element in the dom/container.
- Implementing useState/useEffect/setState for hook functionality. 

MAIN DIFFERENCES BETWEEN REHACKT & REACT!!
- In a real React Application, you will be able to see the "workLoop", "performUnitOfWork", and "updateFunctionComponent".

-ReHackt has to walk through the entire tree from "root" during the render phase, whereas React can skip entire 
sub-trees due to creating linked list relationships which can skip things that are unchanged.

- when ReHackt receives a new update during the render phase, it starts its starts all over again from the root, 
creating the fiber relationships again. Whereas React tags each update with a timestamp and sets which updates 
come first based on timestamp priority queues.


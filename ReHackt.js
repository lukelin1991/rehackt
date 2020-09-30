/* 
first function allows creating elements.  An element is an object with type & props.  
The only thing that the function needs to do is create that object.
children prop will always be an array.  could contain primitive values like strings/numbers.
Wrap everything that isn't an object inside it's own element, create a special type for them: TEXT_ELEMENT.
React doesn't wrap primitive values or create empty arrays when there aren't children, but we do it to simply code.
*/
function createElement(type, props, ...children){
    return {
        type,
        props: {
            ...props,
            children: children.map(child =>
                typeof child === "object"
                ? child
                : createTextElement(child)
            ),
        },
    }
}

function createTextElement(text){
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        }
    }
}

function render(element, container){
    // TODO create dom nodes
    const dom = element.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type)

    const isProperty = key => key !== "children"
    Object.keys(element.props).filter(isProperty).forEach(name => {
        dom[name] = element.props[name]
    })

    element.props.children.forEach(child =>
        render(child, dom)
    )
    container.appendChild(dom)
}

let nextUnitOfWork = null

/* We're refactoring the recursive call because it wont stop unless element tree is fully rendered, problem with
that is that it may block main thread for too long. if browser needs to do high priority stuff, it would have to
wait until render finishes. 

breakdown into smaller chunks. workloop.  requestIdleCallback is no longer used in the official React, they now use
a scheduler package.  But conceptually "requestIdleCallback" would be the same.
*/
function workLoop(deadline){
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(nextUnitOfWork){
    // TODO
}

const Rehackt = {
    createElement,
    render,
}

/** @jsx Rehackt.createElement */
const element = Rehackt.createElement(
    "div",
    { id: "foo" },
    Rehackt.createElement("a", null, "bar"),
    Rehackt.createElement("b")
)


const container = document.getElementById("root")
Rehackt.render(element, container)
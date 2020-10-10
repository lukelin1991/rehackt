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

function createDom(fiber){
    const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type)
    const isProperty = key => key !== "children"

    Object.keys(fiber.props).filter(isProperty).forEach(name => {
        dom[name] = fiber.props[name]
    })

    return dom
}

function render(element, container){
    // TODO create dom nodes
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element],
        }
    }
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

function performUnitOfWork(fiber){
    // TODO
    if(!fiber.dom){
        fiber.dom = createDom(fiber)
    }
    if(fiber.parent){
        fiber.parent.dom.appendChild(fiber.dom)
    }

    const elements = fiber.props.children
    let idx = 0
    let prevSibling = null

    while(idx < elements.length){
        const element = elements[idx]

        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }

        if(idx === 0){
            fiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        idx++
    }
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
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
const isEvent = key => key.startsWith("on")
const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps){
    // remove old properties
    Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
        dom[name] = ""
    })

    //set new or changed properties
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(name => {
        dom[name] = nextProps[name]
    })
}

function commitRoot(){
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber){
    if(!fiber){
        return
    }
    const domParent = fiber.parent.dom
    if(fiber.effectTag === "PLACEMENT" && fiber.dom != null){
        domParent.appendChild(fiber.dom)
    } else if(fiber.effectTag === "UPDATE" && fiber.dom != null){
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    } else if(fiber.effectTag === "DELETION"){
        domParent.removeChild(fiber.dom)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function render(element, container){
    // TODO create dom nodes
    wipRoot = {
        dom: container,
        props: {
            children: [element],
        },
        alternate: currentRoot,
    }
    deletions = []
    nextUnitOfWork = wipRoot
}

let currentRoot = null
let nextUnitOfWork = null
let wipRoot = null
let deletions = null

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

    const elements = fiber.props.children
    reconcileChildren(fiber, elements)

    if (fiber.child){
        return fiber.child
    }

    let nextFiber = fiber
    while(nextFiber){
        if(nextFiber.sibling){
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

function reconcileChildren(wipFiber, elements){
    let idx = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling = null

    while(idx < elements.length || oldFiber != null){
        const element = elements[idx]

        let newFiber = null

        const sameType = oldFiber && element && element.type == oldFiber.type

        if(sameType){
            // TODO update the node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if(element && !sameType){
            // TODO add this node
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if(oldFiber && !sameType){
            // TODO  delete the oldFiber's node
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }
        if(oldFiber){
            oldFiber = oldFiber.sibling
        }
        if(idx === 0){
            wipFiber.child = newFiber
        }
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
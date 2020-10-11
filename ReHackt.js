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
    updateDom(dom, {}, fiber.props)
    return dom
}

const isEvent = key => key.startsWith("on")
const isProperty = key => key !== "children" && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps){

    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key => !(key in nextProps) || isNew(prevProps, nextProps)(key)
        )
        .forEach(name => {
            const eventType = name.toLowerCase().substring(2)
            dom.removeEventListener(eventType, prevProps[name])
        })

    // Remove old properties
    Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(name => {
        dom[name] = ""
    })

    // set new or changed properties
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(name => {
        dom[name] = nextProps[name]
    })

    // Add event listeners
    Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).forEach(name => {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, nextProps[name])
    })
}

function commitRoot(){
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function cancelEffects(fiber){
    if(fiber.hooks){
        fiber.hooks.filter(hook => hook.tag === "effect" && hook.cancel).forEach(effectHook => {
            effectHook.cancel()
        })
    }
}

function runEffects(fiber){
    if(fiber.hooks){
        fiber.hooks.filter(hook => hook.tag === "effect" && hook.effect).forEach(effectHook => {
            effectHook.cancel = effectHook.effect()
        })
    }
}

function commitWork(fiber){
    if(!fiber){
        return
    }
    let domParentFiber = domParentFiber.fiber
    while(!domParentFiber.dom){
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if(fiber.effectTag === "PLACEMENT"){
        if(fiber.dom != null){
            domParent.appendChild(fiber.dom)
        }
        runEffects(fiber)

    } else if(fiber.effectTag === "UPDATE"){
        cancelEffects(fiber)
        if(fiber.dom != null){
            updateDom(fiber.dom, fiber.alternate.props, fiber.props)
        }
        runEffects(fiber)
    } else if(fiber.effectTag === "DELETION"){
        cancelEffects(fiber)
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent){
    if(fiber.dom){
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
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

function workLoop(deadline){
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }
    
    if(!nextUnitOfWork && wipRoot){
        commitRoot()
    }
    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber){
    const isFunctionComponent = fiber.type instanceof Function
    if(isFunctionComponent){
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }
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

let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber){
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

function useState(initial){
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: [],
    }

    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })

    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }

    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

const hasDepsChanged = (prevDeps, nextDeps) => 
    !prevDeps || 
    !nextDeps || prevDeps.length 
    !== nextDeps.length ||
    prevDeps.some((dep, idx) => dep !== nextDeps[idx])

function useEffect(effect, deps){
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]
    const hasChanged = hasDepsChanged(oldHook ? oldHook.deps : undefined, deps)
    const hook = {
        tag: "effect",
        effect: hasChanged ? effect : null,
        cancel: hasChanged && oldHook && oldHook.cancel,
        deps,
    }
    wipFiber.hooks.push(hook)
    hookIndex++
}

function updateHostComponent(fiber){
    if(!fiber.dom){
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
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
        } else if(element){
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        idx++
    }
}

const Rehackt = {
    createElement,
    render,
    useState,
    useEffect,
}

/** @jsx Rehackt.createElement */
function Counter(){
    const [state, setState] = Rehackt.useState(1)
    Rehackt.useEffect(() => {
        console.log(state)
    }, [state])

    return(
        <h1 onClick={() => setState(c => c + 1)}>
            Count: {state}
        </h1>
    )
}

const element = <Counter />
const container = document.getElementById("root")
Rehackt.render(element, container)
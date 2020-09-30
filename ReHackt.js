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

const Rehackt = {
    createElement,
}

/** @jsx Rehackt.createElement */
const element = Rehackt.createElement(
    "div",
    { id: "foo" },
    Rehackt.createElement("a", null, "bar"),
    Rehackt.createElement("b")
)

const container = document.getElementById("root")
ReactDOM.render(element, container)
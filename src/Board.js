import React, { createRef } from "react";
import Dragula from "dragula";
import "dragula/dist/dragula.css";
import Swimlane from "./Swimlane";
import "./Board.css";

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    const clients = [];
    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      },
    };
    console.log("hit");
    this.getClients();
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
    this.backlogDragula = createRef();
    this.inProgressDragula = createRef();
    this.completeDragula = createRef();

    this.drake = null;
  }

  componentDidMount() {
    this.drake = Dragula(
      [
        this.backlogDragula.current,
        this.inProgressDragula.current,
        this.completeDragula.current,
      ],
      {
        revertOnSpill: true,
      },
    );
    this.drake.on("drop", (el, target) => {
      const priority = Array.from(target.children).indexOf(el) + 1;
      this.updateClientStatus(el.dataset.id, target.dataset.status, priority);
      console.log(target.dataset.status);
      if (target.parentElement.children[0].innerText === "In Progress") {
        el.classList = "Card Card-blue";
      } else if (target.parentElement.children[0].innerText === "Complete") {
        el.classList = "Card Card-green";
      } else if (target.parentElement.children[0].innerText === "Backlog") {
        el.classList = "Card Card-grey";
      }
      const backlog = Array.from(this.backlogDragula.current.children).map(
        (child) => child.id,
      );
      const inProgress = Array.from(
        this.inProgressDragula.current.children,
      ).map((child) => child.id);
      const complete = Array.from(this.completeDragula.current.children).map(
        (child) => child.id,
      );

      this.setState({ backlog, inProgress, complete });
    });
  }

  componentWillUnmount() {
    if (this.drake) {
      this.drake.destroy();
    }
  }

  getClients() {
    return fetch("http://localhost:3001/api/v1/clients")
      .then((response) => response.json())
      .then((data) => data.sort((a, b) => a.priority - b.priority))
      .then((data) =>
        this.setState({
          clients: {
            backlog: data.filter(
              (client) => !client.status || client.status === "backlog",
            ),
            inProgress: data.filter(
              (client) => client.status && client.status === "in-progress",
            ),
            complete: data.filter(
              (client) => client.status && client.status === "complete",
            ),
          },
        }),
      )
      .then(() => console.log(this.state.clients));
  }

  updateClientStatus(clientID, newStatus, newPriority) {
    return fetch(`http://localhost:3001/api/v1/clients/${clientID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus, priority: newPriority }),
    })
      .then((response) => response.json())
      .catch((error) => console.error("Error updating client status:", error));
  }

  renderSwimlane(name, clients, ref, parentStatus) {
    return (
      <Swimlane
        name={name}
        clients={clients}
        dragulaRef={ref}
        parentStatus={parentStatus}
      />
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane(
                "Backlog",
                this.state.clients.backlog,
                this.backlogDragula,
                "backlog",
              )}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane(
                "In Progress",
                this.state.clients.inProgress,
                this.inProgressDragula,
                "in-progress",
              )}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane(
                "Complete",
                this.state.clients.complete,
                this.completeDragula,
                "complete",
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

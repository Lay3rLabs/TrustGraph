use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use wavs_types::{Component, ServiceManager, ServiceStatus, Submit, Trigger, WorkflowID};

// this is from the WAVS cli package, would be nice if we exposed it in wavs types instead ?
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct ServiceJson {
    pub name: String,
    pub workflows: BTreeMap<WorkflowID, WorkflowJson>,
    pub status: ServiceStatus,
    pub manager: ServiceManagerJson,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct WorkflowJson {
    pub trigger: TriggerJson,
    pub component: ComponentJson,
    pub submit: SubmitJson,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case", untagged)]
pub enum TriggerJson {
    Trigger(Trigger),
    Json(Json),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case", untagged)]
pub enum SubmitJson {
    Submit(Submit),
    Json(Json),
    AggregatorJson(AggregatorJson),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AggregatorJson {
    Aggregator { url: String, component: ComponentJson },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case", untagged)]
pub enum ServiceManagerJson {
    Manager(ServiceManager),
    Json(Json),
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Json {
    Unset,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case", untagged)]
pub enum ComponentJson {
    Component(Component),
    Json(Json),
}

impl ComponentJson {
    pub fn is_unset(&self) -> bool {
        matches!(self, ComponentJson::Json(Json::Unset))
    }

    pub fn as_component(&self) -> Option<&Component> {
        match self {
            ComponentJson::Component(component) => Some(component),
            ComponentJson::Json(Json::Unset) => None,
        }
    }
}

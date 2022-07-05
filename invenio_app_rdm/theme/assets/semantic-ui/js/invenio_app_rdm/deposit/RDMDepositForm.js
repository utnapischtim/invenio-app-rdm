// This file is part of InvenioRDM
// Copyright (C) 2020-2022 CERN.
// Copyright (C) 2020-2022 Northwestern University.
// Copyright (C) 2021-2022 Graz University of Technology.
//
// Invenio App RDM is free software; you can redistribute it and/or modify it
// under the terms of the MIT License; see LICENSE file for more details.

import { i18next } from "@translations/invenio_app_rdm/i18next";
import _get from "lodash/get";
import _isEmpty from "lodash/isEmpty";
import React, { Component, createRef, Fragment } from "react";
import {
  AccessRightField,
  CommunityHeader,
  CreatibutorsField,
  DatesField,
  DeleteButton,
  DepositFormApp,
  DepositStatusBox,
  DescriptionsField,
  FileUploader,
  FormFeedback,
  IdentifiersField,
  LanguagesField,
  LicenseField,
  PIDField,
  PreviewButton,
  PublicationDateField,
  PublishButton,
  PublisherField,
  RelatedWorksField,
  ResourceTypeField,
  SaveButton,
  SubjectsField,
  TitlesField,
  VersionField,
  FundingField,
} from "react-invenio-deposit";
import { AccordionField } from "react-invenio-forms";
import { Card, Container, Divider, Grid, Ref, Sticky } from "semantic-ui-react";
import PropTypes from "prop-types";
import { CustomFields } from "../custom_fields";

export class RDMDepositForm extends Component {
  constructor(props) {
    super(props);
    this.config = props.config || {};
    const { files, record } = this.props;
    // TODO: retrieve from backend
    this.config["canHaveMetadataOnlyRecords"] = true;

    // TODO: Make ALL vocabulary be generated by backend.
    // Currently, some vocabulary is generated by backend and some is
    // generated by frontend here. Iteration is faster and abstractions can be
    // discovered by generating vocabulary here. Once happy with vocabularies,
    // then we can generate it in the backend.
    this.vocabularies = {
      metadata: {
        ...this.config.vocabularies,

        creators: {
          ...this.config.vocabularies.creators,
          type: [
            { text: "Person", value: "personal" },
            { text: "Organization", value: "organizational" },
          ],
        },

        contributors: {
          ...this.config.vocabularies.contributors,
          type: [
            { text: "Person", value: "personal" },
            { text: "Organization", value: "organizational" },
          ],
        },
        identifiers: {
          ...this.config.vocabularies.identifiers,
        },
      },
    };

    // check if files are present
    this.noFiles = false;
    if (
      !Array.isArray(files.entries) ||
      (!files.entries.length && record.is_published)
    ) {
      this.noFiles = true;
    }
  }

  formFeedbackRef = createRef();
  sidebarRef = createRef();

  render() {
    const { record, files, permissions, preselectedCommunity } = this.props;
    return (
      <DepositFormApp
        config={this.config}
        record={record}
        preselectedCommunity={preselectedCommunity}
        files={files}
        permissions={permissions}
      >
        <FormFeedback
          fieldPath="message"
          labels={this.config.custom_fields.error_labels}
        />
        <CommunityHeader imagePlaceholderLink="/static/images/square-placeholder.png" />
        <Container id="rdm-deposit-form" className="rel-mt-1">
          <Grid className="mt-25">
            <Grid.Column mobile={16} tablet={16} computer={11}>
              <AccordionField
                includesPaths={["files.enabled"]}
                active
                label={i18next.t("Files")}
              >
                {this.noFiles && record.is_published && (
                  <div className="text-align-center pb-10">
                    <em>{i18next.t("The record has no files.")}</em>
                  </div>
                )}
                <FileUploader
                  isDraftRecord={!record.is_published}
                  quota={this.config.quota}
                  decimalSizeDisplay={this.config.decimal_size_display}
                />
              </AccordionField>

              <AccordionField
                includesPaths={[
                  "metadata.resource_type",
                  "metadata.title",
                  "metadata.additional_titles",
                  "metadata.publication_date",
                  "metadata.creators",
                  "metadata.description",
                  "metadata.additional_descriptions",
                  "metadata.rights",
                ]}
                active
                label={i18next.t("Basic information")}
              >
                {this.config.pids.map((pid) => (
                  <Fragment key={pid.scheme}>
                    <PIDField
                      btnLabelDiscardPID={pid.btn_label_discard_pid}
                      btnLabelGetPID={pid.btn_label_get_pid}
                      canBeManaged={pid.can_be_managed}
                      canBeUnmanaged={pid.can_be_unmanaged}
                      fieldPath={`pids.${pid.scheme}`}
                      fieldLabel={pid.field_label}
                      isEditingPublishedRecord={
                        record.is_published === true // is_published is `null` at first upload
                      }
                      managedHelpText={pid.managed_help_text}
                      pidLabel={pid.pid_label}
                      pidPlaceholder={pid.pid_placeholder}
                      pidType={pid.scheme}
                      unmanagedHelpText={pid.unmanaged_help_text}
                      required
                    />
                  </Fragment>
                ))}

                <ResourceTypeField
                  options={this.vocabularies.metadata.resource_type}
                  fieldPath="metadata.resource_type"
                  required
                />
                <TitlesField
                  options={this.vocabularies.metadata.titles}
                  fieldPath="metadata.title"
                  recordUI={record.ui}
                  required
                />
                <PublicationDateField required fieldPath="metadata.publication_date" />
                <CreatibutorsField
                  label={i18next.t("Creators")}
                  labelIcon="user"
                  fieldPath="metadata.creators"
                  roleOptions={this.vocabularies.metadata.creators.role}
                  schema="creators"
                  autocompleteNames={this.config.autocomplete_names}
                  required
                />
                <DescriptionsField
                  fieldPath="metadata.description"
                  options={this.vocabularies.metadata.descriptions}
                  recordUI={_get(record, "ui", null)}
                  editorConfig={{
                    removePlugins: [
                      "Image",
                      "ImageCaption",
                      "ImageStyle",
                      "ImageToolbar",
                      "ImageUpload",
                      "MediaEmbed",
                      "Table",
                      "TableToolbar",
                      "TableProperties",
                      "TableCellProperties",
                    ],
                  }}
                />
                <LicenseField
                  fieldPath="metadata.rights"
                  searchConfig={{
                    searchApi: {
                      axios: {
                        headers: {
                          Accept: "application/vnd.inveniordm.v1+json",
                        },
                        url: "/api/vocabularies/licenses",
                        withCredentials: false,
                      },
                    },
                    initialQueryState: {
                      filters: [["tags", "recommended"]],
                    },
                  }}
                  serializeLicenses={(result) => ({
                    title: result.title_l10n,
                    description: result.description_l10n,
                    id: result.id,
                    link: result.props.url,
                  })}
                />
              </AccordionField>

              <AccordionField
                includesPaths={[
                  "metadata.contributors",
                  "metadata.subjects",
                  "metadata.languages",
                  "metadata.dates",
                  "metadata.version",
                  "metadata.publisher",
                ]}
                active
                label={i18next.t("Recommended information")}
              >
                <CreatibutorsField
                  addButtonLabel={i18next.t("Add contributor")}
                  label={i18next.t("Contributors")}
                  labelIcon="user plus"
                  fieldPath="metadata.contributors"
                  roleOptions={this.vocabularies.metadata.contributors.role}
                  schema="contributors"
                  autocompleteNames={this.config.autocomplete_names}
                  modal={{
                    addLabel: "Add contributor",
                    editLabel: "Edit contributor",
                  }}
                />
                <SubjectsField
                  fieldPath="metadata.subjects"
                  initialOptions={_get(record, "ui.subjects", null)}
                  limitToOptions={this.vocabularies.metadata.subjects.limit_to}
                />

                <LanguagesField
                  fieldPath="metadata.languages"
                  initialOptions={_get(record, "ui.languages", []).filter(
                    (lang) => lang !== null
                  )} // needed because dumped empty record from backend gives [null]
                  serializeSuggestions={(suggestions) =>
                    suggestions.map((item) => ({
                      text: item.title_l10n,
                      value: item.id,
                      key: item.id,
                    }))
                  }
                />
                <DatesField
                  fieldPath="metadata.dates"
                  options={this.vocabularies.metadata.dates}
                />
                <VersionField fieldPath="metadata.version" />
                <PublisherField fieldPath="metadata.publisher" />
              </AccordionField>

              <AccordionField
                includesPaths={["metadata.funding"]}
                active
                label="Funding"
                ui={this.accordionStyle}
              >
                <FundingField
                  fieldPath="metadata.funding"
                  searchConfig={{
                    searchApi: {
                      axios: {
                        headers: {
                          Accept: "application/vnd.inveniordm.v1+json",
                        },
                        url: "/api/awards",
                        withCredentials: false,
                      },
                    },
                    initialQueryState: {
                      sortBy: "bestmatch",
                      sortOrder: "asc",
                      layout: "list",
                      page: 1,
                      size: 5,
                    },
                  }}
                  label="Awards"
                  labelIcon="money bill alternate outline"
                  deserializeAward={(award) => {
                    return {
                      title: award.title_l10n,
                      number: award.number,
                      funder: award.funder ?? "",
                      id: award.id,
                      ...(award.identifiers && {
                        identifiers: award.identifiers,
                      }),
                      ...(award.acronym && { acronym: award.acronym }),
                    };
                  }}
                  deserializeFunder={(funder) => {
                    return {
                      id: funder.id,
                      name: funder.name,
                      ...(funder.title_l10n && { title: funder.title_l10n }),
                      ...(funder.pid && { pid: funder.pid }),
                      ...(funder.country && { country: funder.country }),
                      ...(funder.identifiers && {
                        identifiers: funder.identifiers,
                      }),
                    };
                  }}
                  computeFundingContents={(funding) => {
                    let headerContent,
                      descriptionContent,
                      awardOrFunder = "";

                    if (funding.funder) {
                      const funderName =
                        funding.funder?.name ??
                        funding.funder?.title ??
                        funding.funder?.id ??
                        "";
                      awardOrFunder = "funder";
                      headerContent = funderName;
                      descriptionContent = "";

                      // there cannot be an award without a funder
                      if (funding.award) {
                        awardOrFunder = "award";
                        descriptionContent = funderName;
                        headerContent = funding.award.title;
                      }
                    }

                    return { headerContent, descriptionContent, awardOrFunder };
                  }}
                />
                <Divider />
              </AccordionField>

              <AccordionField
                includesPaths={["metadata.identifiers"]}
                active
                label={i18next.t("Alternate identifiers")}
              >
                <IdentifiersField
                  fieldPath="metadata.identifiers"
                  label={i18next.t("Alternate identifiers")}
                  labelIcon="barcode"
                  schemeOptions={this.vocabularies.metadata.identifiers.scheme}
                />
              </AccordionField>

              <AccordionField
                includesPaths={["metadata.related_identifiers"]}
                active
                label={i18next.t("Related works")}
              >
                <RelatedWorksField
                  fieldPath="metadata.related_identifiers"
                  options={this.vocabularies.metadata.identifiers}
                />
              </AccordionField>
              {!_isEmpty(this.config.custom_fields.ui) && (
                <CustomFields config={this.config.custom_fields.ui} />
              )}
            </Grid.Column>
            <Ref innerRef={this.sidebarRef}>
              <Grid.Column
                mobile={16}
                tablet={16}
                computer={5}
                className="deposit-sidebar"
              >
                <Sticky context={this.sidebarRef} offset={20}>
                  <Card>
                    <Card.Content>
                      <DepositStatusBox />
                    </Card.Content>
                    <Card.Content>
                      <Grid relaxed>
                        <Grid.Column
                          computer={8}
                          mobile={16}
                          className="pb-0 left-btn-col"
                        >
                          <SaveButton fluid />
                        </Grid.Column>

                        <Grid.Column
                          computer={8}
                          mobile={16}
                          className="pb-0 right-btn-col"
                        >
                          <PreviewButton fluid />
                        </Grid.Column>

                        <Grid.Column width={16} className="pt-10">
                          <PublishButton fluid />
                        </Grid.Column>
                      </Grid>
                    </Card.Content>
                  </Card>

                  <AccessRightField
                    label={i18next.t("Visibility")}
                    labelIcon="shield"
                    fieldPath="access"
                  />
                  {permissions?.can_delete_draft && (
                    <Card>
                      <Card.Content>
                        <DeleteButton
                          fluid
                          // TODO: make is_published part of the API response
                          //       so we don't have to do this
                          isPublished={record.is_published}
                        />
                      </Card.Content>
                    </Card>
                  )}
                </Sticky>
              </Grid.Column>
            </Ref>
          </Grid>
        </Container>
      </DepositFormApp>
    );
  }
}

RDMDepositForm.propTypes = {
  config: PropTypes.object.isRequired,
  record: PropTypes.object.isRequired,
  preselectedCommunity: PropTypes.object,
  files: PropTypes.object,
  permissions: PropTypes.object,
};

RDMDepositForm.defaultProps = {
  preselectedCommunity: undefined,
  permissions: null,
  files: null,
};

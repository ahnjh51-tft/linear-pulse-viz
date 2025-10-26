import { gql } from '@apollo/client';

export const GET_VIEWER = gql`
  query GetViewer {
    viewer {
      id
      name
      email
      organization {
        id
        name
        urlKey
      }
    }
  }
`;

export const GET_TEAMS = gql`
  query GetTeams {
    teams(first: 50) {
      nodes {
        id
        name
        key
        description
        icon
        color
      }
    }
  }
`;

export const GET_TEAM_PROJECTS = gql`
  query GetTeamProjects($teamId: String!) {
    team(id: $teamId) {
      id
      name
      projects(first: 100) {
        nodes {
          id
          name
          state
          progress
          targetDate
          startDate
          description
          updatedAt
          lead {
            id
            name
            avatarUrl
          }
          projectMilestones {
            nodes {
              id
              name
              targetDate
            }
          }
        }
      }
    }
  }
`;

export const GET_TEAM_ISSUES = gql`
  query GetTeamIssues($teamId: String!, $first: Int = 200) {
    team(id: $teamId) {
      id
      issues(first: $first) {
        nodes {
          id
          identifier
          title
          priority
          createdAt
          completedAt
          startedAt
          dueDate
          updatedAt
          estimate
          state {
            id
            name
            type
          }
          assignee {
            id
            name
            avatarUrl
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          project {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_WORKSPACE_USERS = gql`
  query GetWorkspaceUsers {
    users(first: 100) {
      nodes {
        id
        name
        email
        avatarUrl
        active
      }
    }
  }
`;

export const GET_PROJECT_MILESTONES = gql`
  query GetProjectMilestones($projectId: String!) {
    project(id: $projectId) {
      id
      projectMilestones {
        nodes {
          id
          name
          description
          targetDate
          sortOrder
        }
      }
    }
  }
`;

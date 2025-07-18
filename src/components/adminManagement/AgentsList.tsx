import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface AgentsListProps {
  agents: Agent[];
  getStatusColor: (status: string) => string;
  formatLastLogin: (lastLogin?: string) => string;
}

export default function AgentsList({
  agents,
  getStatusColor,
  formatLastLogin,
}: AgentsListProps) {
  return (
    <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No agents found
            </p>
          ) : (
            agents.map((agent) => (
              <div
                key={agent._id}
                className="flex items-center justify-between p-4 border  rounded-lg  bg-white/50 dark:bg-gray-800/50 hover:bg-white/70  transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      {agent.firstName[0]}
                      {agent.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {agent.firstName} {agent.lastName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.email}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-300">
                        Last login: {formatLastLogin(agent.lastLogin)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

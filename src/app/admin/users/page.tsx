

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserPlus, Info } from "lucide-react";
import { getUsers, addSampleUsers } from "@/app/actions";
import { UserProfile } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSampleUserNote, setShowSampleUserNote] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let fetchedUsers = await getUsers();
        // If there's only 1 user (the admin), seed the sample users.
        if (fetchedUsers.length < 2) {
            console.log("Not enough users found, creating sample users...");
            await addSampleUsers();
            fetchedUsers = await getUsers();
            setShowSampleUserNote(true);
        }
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load users from the database.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]);

  const formatLastSeen = (dateString: string) => {
    if (!dateString) return "Never";
    return `${formatDistanceToNow(new Date(dateString))} ago`;
  }

  return (
    <>
    {showSampleUserNote && (
        <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Sample Users Created</AlertTitle>
            <AlertDescription>
                We've added some sample user profiles to your database. To log in as them, you'll need to create corresponding users in the <b>Firebase Authentication</b> console with the same email addresses.
            </AlertDescription>
        </Alert>
    )}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
                View and manage all registered users.
            </CardDescription>
        </div>
        <Button disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Last Seen</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                ))
            ) : users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No users found. New users will appear here after they sign up.
                    </TableCell>
                </TableRow>
            ) : (
                users.map((user) => (
                <TableRow key={user.uid}>
                    <TableCell>
                    <div className="font-medium">{user.email}</div>
                    </TableCell>
                    <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'premium' ? 'secondary' : 'outline'}>
                        {user.role}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatLastSeen(user.lastSeen)}</TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" disabled>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("POST /api/study-groups - Session:", session);
    
    if (!session?.user?.email) {
      console.log("POST /api/study-groups - No session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      console.log("POST /api/study-groups - No name provided");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log("POST /api/study-groups - User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a unique invite code
    const inviteCode = randomBytes(6).toString("hex");

    // Create the study group
    const studyGroup = await prisma.studyGroup.create({
      data: {
        name,
        inviteCode,
        adminId: user.id,
        members: {
          connect: { id: user.id }, // Add the admin as a member
        },
      },
      include: {
        admin: true,
        members: true,
      },
    });

    console.log("POST /api/study-groups - Created group:", studyGroup.id);
    return NextResponse.json(studyGroup);
  } catch (error) {
    console.error("POST /api/study-groups - Error:", error);
    return NextResponse.json(
      { error: "Failed to create study group" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Log request headers for debugging
    const headersList = headers();
    console.log("GET /api/study-groups - Headers:", {
      cookie: headersList.get("cookie"),
      authorization: headersList.get("authorization"),
    });

    const session = await getServerSession(authOptions);
    console.log("GET /api/study-groups - Session:", {
      exists: !!session,
      user: session?.user ? {
        email: session.user.email,
        name: session.user.name,
        id: session.user.id,
      } : null,
    });

    if (!session?.user?.email) {
      console.log("GET /api/study-groups - No valid session found");
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - No valid session" }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        adminOfGroups: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        memberOfGroups: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.log("GET /api/study-groups - User not found in database:", session.user.email);
      return new NextResponse(
        JSON.stringify({ error: "User not found in database" }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = {
      adminOf: user.adminOfGroups,
      memberOf: user.memberOfGroups,
    };

    console.log("GET /api/study-groups - Success:", {
      adminGroups: user.adminOfGroups.length,
      memberGroups: user.memberOfGroups.length,
    });

    return new NextResponse(
      JSON.stringify(response),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error("GET /api/study-groups - Error:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 
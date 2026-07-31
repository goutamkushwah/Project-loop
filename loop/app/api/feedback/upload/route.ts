import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

import { requireCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();

    const formData = await request.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is required",
        },
        { status: 400 }
      );
    }


    const text = await file.text();


    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });


    const errors: any[] = [];
    const validRows: any[] = [];


    const allowedChannels = [
      "SUPPORT_TICKET",
      "LIVE_CHAT",
      "APP_STORE_REVIEW",
      "NPS_SURVEY",
      "CSAT_SURVEY",
      "SALES_CALL_NOTE",
      "COMMUNITY_POST",
      "SOCIAL_MENTION",
    ];


    rows.forEach((row:any,index:number)=>{


      if(!row.content){

        errors.push({
          row:index+2,
          error:"Content is required"
        });

        return;
      }


      if(!row.channel){

        errors.push({
          row:index+2,
          error:"Channel is required"
        });

        return;
      }



      if(!allowedChannels.includes(row.channel)){

        errors.push({
          row:index+2,
          error:"Invalid channel"
        });

        return;
      }



      validRows.push({

        content:row.content,

        channel:row.channel,

        customerLabel:row.customerLabel || null,

        workspaceId:user.workspaceId,

      });


    });



    if(validRows.length){

      await db.feedback.createMany({

        data:validRows

      });

    }



    return NextResponse.json({

      success:true,

      total:rows.length,

      inserted:validRows.length,

      failed:errors.length,

      errors

    });



  } catch(error:any){


    console.error(error);


    return NextResponse.json(
      {
        success:false,
        message:"Upload failed"
      },
      {
        status:500
      }
    );


  }
}
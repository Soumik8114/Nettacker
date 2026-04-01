$(document).ready(function () {
  // a function to replace chars in string
  String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, "g"), replacement);
  };

  // hide set session key
  $("#set_session").hide();

  //check session key
  $.ajax({
    type: "GET",
    url: "/session/check",
    dataType: "text",
  })
    .done(function (res) {
      $("#set_session").addClass("hidden");
      $("#set_session").hide();
      $("#logout_btn").removeClass("hidden");
      $("#logout_btn").show();
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#set_session").removeClass("hidden");
      $("#set_session").show();
      $("#logout_btn").addClass("hidden");
      $("#logout_btn").hide();
    });

  // set session key
  $("#session_value").keyup(function (event) {
    if (event.keyCode === 13) {
      $("#send_session").click();
    }
  });

  // login
  $("#send_session").click(function () {
    var key = "/session/set?key=" + $("#session_value").val();
    $.ajax({
      type: "GET",
      url: key,
      dataType: "text",
    })
      .done(function (res) {
        $("#set_session").hide();
        $("#success_key").removeClass("hidden");
        setTimeout(function() { 
          $("#success_key").addClass("animated fadeOut"); 
        }, 5000);
        setTimeout(function() { 
          $("#success_key").addClass("hidden"); 
        }, 5000);
        $("#logout_btn").removeClass("hidden");
        $("#logout_btn").show();
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        $("#set_session").hide();
        $("#failed_key").removeClass("hidden");
        setTimeout(function() { 
          $("#failed_key").addClass("hidden"); 
        }, 5000);
        $("#set_session").show();
      });
  });

  // logout
  $("#logout_btn").click(function () {
    $.ajax({
      type: "GET",
      url: "/session/kill",
      dataType: "text",
    })
      .done(function (res) {
        $("#session_value").val("");
        $("#logout_btn").addClass("hidden");
        $("#logout_btn").hide();
        $("#set_session").removeClass("hidden");
        $("#set_session").show();
        $("#logout_success").removeClass("hidden");
        setTimeout(function() { $("#logout_success").addClass("animated fadeOut"); }, 1000);
        setTimeout(function() { $("#logout_success").addClass("hidden"); }, 1500);
        // Redirect to home
        setTimeout(function() { $("#home_btn").click(); }, 2000);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        alert("Error during logout. Please refresh the page.");
      });
  });

  // hide all views
  function hide_all_views() {
    $("#home").addClass("hidden");
    $("#new_scan").addClass("hidden");
    $("#get_results").addClass("hidden");
    $("#crawler_area").addClass("hidden");
    $("#compare_area").addClass("hidden");
    $("#current_scans_list_area").addClass("hidden");
    $("#scan_progress").addClass("hidden");
    $("#login_first").addClass("hidden");
  }

  // home
  $("#home_btn").click(function () {
    hide_all_views();
    $("#home").removeClass("hidden");
  });

  // new scan
  $("#new_scan_btn").click(function () {
    $.ajax({
      type: "GET",
      url: "/session/check",
      dataType: "text",
    })
      .done(function (res) {
        hide_all_views();
        $("#new_scan").removeClass("hidden");
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        hide_all_views();
        $("#login_first").removeClass("hidden");
      });
  });

  // results crawler
  $("#results_btn").click(function () {
    hide_all_views();
    $("#get_results").removeClass("hidden");
  });

  // hosts crawler
  $("#crawler_btn").click(function () {
    hide_all_views();
    $("#crawler_area").removeClass("hidden");
  });

  // Compare scans
  $("#compare_btn").click(function() {
    $.ajax({
      type: "GET",
      url: "/session/check",
      dataType: "text",
    })
      .done(function (res) {
        hide_all_views();
        $("#compare_area").removeClass("hidden");
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        hide_all_views();
        $("#login_first").removeClass("hidden");
      });
  });

  // Current Scans View
  $("#current_scans_btn, #back_to_current_scans_btn").click(function () {
    $.ajax({
      type: "GET",
      url: "/session/check",
      dataType: "text",
    })
      .done(function (res) {
        hide_all_views();
        $("#current_scans_list_area").removeClass("hidden");
        load_current_scans();
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        hide_all_views();
        $("#login_first").removeClass("hidden");
      });
  });

  $("#refresh_current_scans_btn").click(function () {
    load_current_scans();
  });

  function load_current_scans() {
    $.ajax({
      type: "GET",
      url: "/scan/list",
      dataType: "json",
    })
      .done(function (res) {
        var HTMLData = "";
        var hasScans = false;
        if (res && res.scans) {
          for (var scan_id in res.scans) {
             hasScans = true;
             var scan = res.scans[scan_id];
             var target_text = scan.total_targets + " targets";
             var status_class = scan.status === 'completed' ? 'label-success' :
                               (scan.status === 'failed' ? 'label-danger' :
                               (scan.status === 'stopped' ? 'label-warning' : 'label-info'));

             HTMLData += '<a href="javascript:void(0);" onclick="view_scan_progress(\\'' + scan_id + '\\')" class="list-group-item list-group-item-action flex-column align-items-start">' +
               '<div class="d-flex w-100 justify-content-between">' +
               '<h5 class="mb-1"><strong>Scan ID:</strong> ' + scan_id + '</h5>' +
               '</div>' +
               '<p class="mb-1"><strong>Targets:</strong> ' + target_text + ' | <strong>Modules:</strong> ' + scan.total_modules + '</p>' +
               '<small><span class="label ' + status_class + '">' + scan.status.toUpperCase() + '</span></small>' +
               '</a>';
          }
        }
        if (!hasScans) {
           HTMLData = "<p>No scans are currently running.</p>";
        }
        $("#current_scans_list").html(HTMLData);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
         $("#current_scans_list").html("<p class='text-danger'>Failed to load currently running scans.</p>");
      });
  }

  // Make view_scan_progress available globally
  window.view_scan_progress = function(scan_id) {
    hide_all_views();
    $("#scan_progress").removeClass("hidden");

    // Reset UI before loading
    $("#scan_id_display").text(scan_id);
    $("#start_time").text("Loading...");
    $("#targets_count").text(0);
    $("#progress_percentage").text(0);
    $("#progress_bar").css("width", "0%").attr("aria-valuenow", 0).text("0%");
    $("#current_target").text("Loading...");
    $("#current_module").text("Loading...");
    $("#elapsed_time").text("00:00:00");
    $("#remaining_time").text("Loading...");
    $("#issues_found").text("0");
    $("#hosts_scanned").text("0");
    $("#modules_run").text("0");
    $("#open_ports").text("0");
    $("#services_found").text("0");
    $("#scan_status").removeClass("label-success label-danger label-warning label-info").addClass("label-info").text("LOADING");
    $("#stop_scan_btn").prop("disabled", false);
    $("#live_log").html('<span class="text-muted">[Loading scan events...]</span>');
    window.seenEventKeys = {};

    // Start monitoring
    var startTime = new Date(); // Note: We might want actual start time from backend if available
    startLiveScanMonitoring(scan_id, startTime);
  };

  // Create the compare report
  $("#create_compare_report").click(function() {
    var tmp_data = {
      scan_id_first: $("#scan_id_first").val(),
      scan_id_second: $("#scan_id_second").val(),
      compare_report_path: $("#compare_report_path").val(),
    };
    var key = "";
    var data = {};
    for (key in tmp_data) {
      if (
        tmp_data[key] != "" &&
        tmp_data[key] != false &&
        tmp_data[key] != null
      ) {
        data[key] = tmp_data[key];
      }
    }
    $.ajax({
      type: "POST",
      url: "/compare/scans",
      data: data,
    })
      .done(function (response, textStatus, jqXHR) {
        if (response.status === "success") {
          $("#success_report").removeClass("hidden");
          setTimeout('$("#success_report").addClass("animated fadeOut");', 5000);
          setTimeout('$("#success_report").addClass("hidden");', 6000);
          $("#success_report").removeClass("animated fadeOut");
        }
        else {
          document.getElementById("report_error_msg").innerHTML = response.message;
          $("#failed_report").removeClass("hidden");
          setTimeout('$("#failed_report").addClass("hidden");', 5000);
        }})
      .fail(function (jqXHR, textStatus, errorThrown) {
        var errorMessage = "An error occurred while comparing scans.";
        if(jqXHR.responseJSON && jqXHR.responseJSON.msg){
          errorMessage = jqXHR.responseJSON.msg;
        }
        document.getElementById("report_error_msg").innerHTML = errorMessage;
        $("#failed_report").removeClass("hidden");
        setTimeout('$("#failed_report").addClass("hidden");', 5000);
      });
  });

  // start tutorial
  $("#tutorial_btn").click(function () {
    if ($("#logout_btn").is(":hidden")) {
      var intro = introJs();
      intro.addSteps([
        {
          element: document.querySelectorAll("#session_value")[0],
          intro:
            "Please enter your API Key to proceed and click set session to proceed.",
          position: "right",
        },
      ]);
      intro.start();
    } else {
      var intro = introJs();
      intro.addSteps([
        {
          intro: "Welcome to the OWASP Nettacker Web View Tutorial!",
        },
        {
          element: document.querySelectorAll("#new_scan_btn")[0],
          intro: "Click this button and select Next.",
          position: "right",
        },
        {
          intro: "This is the area where you can perform new scans.",
        },
        {
          element: document.querySelectorAll("#targets-entry")[0],
          intro:
            "Enter your targets here. You enter a target and then press enter to enter a new target.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#scan_options_combined")[0],
          intro:
            "Select the scans or brute forces you want to perform on your target.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#graph_name")[0],
          intro:
            "Select the output type of graph. The default is d3_tree_v2_graph.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#languages-entry")[0],
          intro:
            "Select the language in which you want report in. We support a number of languages.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#output_file")[0],
          intro:
            "Enter the location of the file you want your output in or leave it to the default value.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#advance")[0],
          intro: "Click here to see some of the more advanced options.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#advance_options")[0],
          intro: "These are some of the advanced options you can fiddle with.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#submit_new_scan")[0],
          intro: "Click here to scan the targets with the selected options",
          position: "right",
        },
        {
          element: document.querySelectorAll("#results_btn")[0],
          intro:
            "Click here to view all the results sorted by the time they were performed.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#crawler_btn")[0],
          intro:
            "Click here to view all the results sorted by the target on which it was performed.",
          position: "right",
        },
        {
          element: document.querySelectorAll("#compare_btn_ul")[0],
          intro:
            "Click here to compare two scans and generate a compare report",
          position: "right",
        },
        {
          element: document.querySelectorAll("#logout_btn")[0],
          intro: "Click here to destroy your session.",
          position: "right",
        },
        {
          intro:
            "This is the end of tutorial. If you have any questions, suggestions or " +
            "feedback please contact us on Github. Thank you.",
        },
      ]);
      intro
        .setOption("showProgress", true)
        .setOption("showBullets", false)
        .start();
    }
  });

  // submit new scan
  $("#submit_new_scan").click(function () {
    // set variables
    // check ranges
    if (document.getElementById("scan_ip_range").checked) {
      var p_1 = true;
    } else {
      var p_1 = false;
    }
    // ping before scan
    if (document.getElementById("ping_before_scan").checked) {
      var p_2 = true;
    } else {
      var p_2 = false;
    }
    // subdomains
    if (document.getElementById("scan_subdomains").checked) {
      var p_3 = true;
    } else {
      var p_3 = false;
    }

    if (document.getElementById("skip_service_discovery").checked) {
      var skip_service_discovery = true;
    } else {
      var skip_service_discovery = false;
    }
    // profiles
    var p = [];
    var n = 0;
    $("#profiles input:checked").each(function () {
      if (this.id !== "all_profiles") {
        p[n] = this.id;
        n += 1;
      }
    });
    var profiles = p.join(",");

    // scan_methods
    n = 0;
    sm = [];
    $("#selected_modules input:checked").each(function () {
      sm[n] = this.id;
      n += 1;
    });
    var selected_modules = sm.join(",");
    // language
    var language = "";
    $("#languages option:selected").each(function () {
      language = this.id;
    });

    // graph_name
    var graph_name = "";
    $("#graph_name input:checked").each(function () {
      graph_name = this.id;
    });

    // build post data
    var tmp_data = {
      targets: $("#targets").val(),
      profiles: profiles,
      selected_modules: selected_modules,
      graph_name: graph_name,
      language: language,
      report_path_filename: $("#output_file").val(),
      scan_ip_range: p_1,
      scan_subdomains: p_3,
      ping_before_scan: p_2,
      thread_per_host: $("#thread_per_host").val(),
      parallel_host_scan: $("#parallel_host_scan").val(),
      retries: $("#retries").val(),
      time_sleep_between_requests: $("#time_sleep_between_requests").val(),
      timeout: $("#timeout").val(),
      verbose_mode: $("#verbose_mode").val(),
      ports: $("#ports").val(),
      socks_proxy: $("#socks_proxy").val(),
      usernames: $("#usernames").val(),
      passwords: $("#passwords").val(),
      skip_service_discovery: skip_service_discovery,
      excluded_ports: $('#exclude_ports').val(),
      http_header: $('#http_headers').val()
    };

    // replace "" with null
    var key = "";
    var data = {};
    for (key in tmp_data) {
      if (
        tmp_data[key] != "" &&
        tmp_data[key] != false &&
        tmp_data[key] != null
      ) {
        data[key] = tmp_data[key];
      }
    }

    $.ajax({
      type: "POST",
      url: "/new/scan",
      data: data,
    })
      .done(function (res) {
        var results = JSON.stringify(res);
        results = results.replaceAll(",", ",<br>");
        document.getElementById("success_msg").innerHTML = results;
        $("#success_request").removeClass("hidden");
        setTimeout('$("#success_request").addClass("animated fadeOut");', 5000);
        setTimeout('$("#success_request").addClass("hidden");', 6000);
        $("#success_request").removeClass("animated fadeOut");

        // Start live progress monitoring if scan_id is provided
        if (res && res.scan_id) {
          var scanId = res.scan_id;
          var startTime = new Date();

          // Reset UI
          $("#scan_id_display").text(scanId);
          $("#start_time").text(startTime.toLocaleString());
          $("#targets_count").text(res.total_targets || 0);
          $("#progress_percentage").text(0);
          $("#progress_bar")
            .css("width", "0%")
            .attr("aria-valuenow", 0)
            .text("0%");
          $("#current_target").text("Waiting to start...");
          $("#current_module").text("Initializing...");
          $("#elapsed_time").text("00:00:00");
          $("#remaining_time").text("Calculating...");
          $("#issues_found").text("0");
          $("#hosts_scanned").text("0");
          $("#modules_run").text("0");
          $("#open_ports").text("0");
          $("#services_found").text("0");
          $("#scan_status")
            .removeClass("label-success label-danger label-warning")
            .addClass("label-info")
            .text("RUNNING");
          $("#stop_scan_btn").prop("disabled", false);
          $("#live_log").html('<span class="text-muted">[Scan starting...]</span>');
          window.seenEventKeys = {};

          // Switch view
          hide_all_views();
          $("#scan_progress").removeClass("hidden");

          // Start polling
          startLiveScanMonitoring(scanId, startTime);
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        document.getElementById("error_msg").innerHTML = jqXHR.responseText;
        if (errorThrown == "BAD REQUEST") {
          $("#failed_request").removeClass("hidden");
          setTimeout('$("#failed_request").addClass("hidden");', 5000);
        }
        if (errorThrown == "UNAUTHORIZED") {
          $("#failed_request").removeClass("hidden");
          setTimeout('$("#failed_request").addClass("hidden");', 5000);
        }
      });
  });

  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split("&"),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  };

  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split("&"),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  };

  // show scans in the html
  function show_scans(res) {
    res = JSON.parse(res);
    var HTMLData = "";
    var i;
    var id;
    var date;
    var scan_id;
    // var report_filename;
    // var events_num;
    // var verbose;
    // var start_api_server;
    // var report_type;
    // var graph_name;
    // var category;
    // var profile;
    // var selected_modules;
    // var language;
    // var scan_cmd;
    // var ports;
    // var flags = {
    //   el: "gr",
    //   fr: "fr",
    //   en: "us",
    //   nl: "nl",
    //   ps: "ps",
    //   tr: "tr",
    //   de: "de",
    //   ko: "kr",
    //   it: "it",
    //   ja: "jp",
    //   fa: "ir",
    //   hy: "am",
    //   ar: "sa",
    //   "zh-cn": "cn",
    //   vi: "vi",
    //   ru: "ru",
    //   hi: "in",
    //   ur: "pk",
    //   id: "id",
    //   es: "es",
    // };

    for (i = 0; i < res.length; i++) {
      id = res[i]["id"];
      date = res[i]["date"];
      scan_id = res[i]["scan_id"];
      // report_filename = res[i]["report_filename"];
      // events_num = res[i]["events_num"];
      // verbose = res[i]["verbose"];
      // start_api_server = res[i]["start_api_server"];
      // report_type = res[i]["report_type"];
      // graph_name = res[i]["graph_name"];
      // category = res[i]["category"];
      // profile = res[i]["profile"];
      // selected_modules = res[i]["selected_modules"];
      // language = res[i]["language"];
      // // scan_cmd = res[i]["scan_cmd"];
      // ports = res[i]["ports"];
      // host = scan_cmd.split(" ")[2];
      HTMLData +=
        "<a target='_blank' href=\"/results/get?id=" +
        id +
        '" class="list-group-item list-group-item-action flex-column align-items-start">\n' +
        '<div class="row" ><div class="d-flex w-100">\n' +
        '<h3  class="mb-1">&nbsp;&nbsp;&nbsp;<span id="logintext"\n' +
        'class="bold label label-primary">' +
        id +
        "</span>" +
        '<small class="label label-info card-date">' +
        date +
        "</small></h3>" +
        "</div></div>" +
        "<hr class='card-hr'>" +
        "<p class='mb-1  bold label label-default'>scan_id:" +
        scan_id +
        "</p><br>"
        // "<p class='mb-1  bold label label-info'>report_filename:" +
        // report_filename +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-success'>events_num:" +
        // events_num +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-danger'>ports:" +
        // ports +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-info'>category:" +
        // category +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-success'>profile:" +
        // profile +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-warning'>selected_modules:" +
        // selected_modules +
        // "</p><br>" +
        // "<p class='mb-1 bold  label label-primary'>start_api_server:" +
        // start_api_server +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-warning'>verbose:" +
        // verbose +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-info'>report_type:" +
        // report_type +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-primary'>graph_name:" +
        // graph_name +
        // "</p><br>" +
        // "<p class='mb-1 bold label label-success'>language:" +
        // language +
        // "</p>" +
        // "<span class='card-flag flag-icon flag-icon-" +
        // flags[language] +
        // "'></span><br>" +
        // "<p class='mb-1 bold label label-default'>scan_cmd:" +
        // scan_cmd +
        // "</p>" +
        // '</p>\n </a>' +
        '<button class="mb-1 bold label card-date""><a href="/results/get_json?id=' +
        id +
        '">Get JSON</a></button>' +
        '<button class="mb-1 bold label card-date""><a href="/results/get_csv?id=' +
        id +
        '">Get CSV </a></button>';
    }

    if (res["msg"] == "No more search results") {
      HTMLData = '<p class="mb-1"> No more results to show!!</p>';
    }

    document.getElementById("scan_results").innerHTML = HTMLData;
  }

  function get_results_list(result_page) {
    $.ajax({
      type: "GET",
      url: "/results/get_list?page=" + result_page,
      dataType: "text",
    })
      .done(function (res) {
        $("#login_first").addClass("hidden");
        $("#scan_results").removeClass("hidden");
        $("#refresh_btn").removeClass("hidden");
        $("#nxt_prv_btn").removeClass("hidden");
        show_scans(res);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        if (errorThrown == "UNAUTHORIZED") {
          $("#login_first").removeClass("hidden");
          $("#get_results").addClass("hidden");
          $("#refresh_btn").addClass("hidden");
          $("#nxt_prv_btn").addClass("hidden");
          $("#home").addClass("hidden");
          $("#crawler_area").addClass("hidden");
          $("#compare_area").addClass("hidden");
        } else {
          $("#login_first").addClass("hidden");
          $("#scan_results").removeClass("hidden");
          $("#refresh_btn").removeClass("hidden");
          $("#nxt_prv_btn").removeClass("hidden");
        }
      });
  }

  $("#results_btn").click(function () {
    result_page = 1;
    get_results_list(result_page);
  });

  $("#refresh_btn_update").click(function () {
    result_page = 1;
    get_results_list(result_page);
  });

  $("#refresh_btn_page").click(function () {
    get_results_list(result_page);
  });

  $("#previous_btn").click(function () {
    result_page = result_page - 1;
    if (result_page == 1) {
      $("#previous_btn").hide();
    }
    if (result_page == 2) {
      $("#previous_btn").show();
    }
    get_results_list(result_page);
  });

  $(".checkAll").click(function () {
    $(".checkbox").prop("checked", $(this).prop("checked"));
  });

  $(".checkbox-brute").click(function () {
    $(".checkbox-brute-module").prop("checked", $(this).prop("checked"));
  });

  $(".checkbox-scan").click(function () {
    $(".checkbox-scan-module").prop("checked", $(this).prop("checked"));
  });

  $(".checkbox-vulnerability").click(function () {
    $(".checkbox-vuln-module").prop("checked", $(this).prop("checked"));
  });

  $(".check-all-profiles").click(function () {
    $("#profiles input[type='checkbox']").not(this).prop("checked", $(this).prop("checked"));
  });

  $(".check-all-scans").click(function () {
    $(".checkbox-brute-module").prop("checked", $(this).prop("checked"));
    $(".checkbox-scan-module").prop("checked", $(this).prop("checked"));
    $(".checkbox-vuln-module").prop("checked", $(this).prop("checked"));
  });

  $(".checkbox-vuln-module").click(function () {
    if (!$(this).is(":checked")) {
      $(".checkAll").prop("checked", false);
      $(".checkbox-vulnerability").prop("checked", false);
      $(".check-all-scans").prop("checked", false);
    }
  });

  $(".checkbox-scan-module").click(function () {
    if (!$(this).is(":checked")) {
      $(".checkAll").prop("checked", false);
      $(".checkbox-scan").prop("checked", false);
      $(".check-all-scans").prop("checked", false);
    }
  });

  $(".checkbox-brute-module").click(function () {
    if (!$(this).is(":checked")) {
      $(".checkAll").prop("checked", false);
      $(".checkbox-brute").prop("checked", false);
      $(".check-all-scans").prop("checked", false);
    }
  });

  $("#next_btn").click(function () {
    result_page = result_page + 1;
    if (result_page == 1) {
      $("#previous_btn").hide();
    }
    if (result_page == 2) {
      $("#previous_btn").show();
    }
    get_results_list(result_page);
  });

  $("#advance").click(function () {
    $("#basic_options").addClass("hidden");
    $("#advance_options").removeClass("hidden");
  });

  $("#basic").click(function () {
    $("#advance_options").addClass("hidden");
    $("#basic_options").removeClass("hidden");
  });
function obsKeysToString(o, k, sep) {
 return k.map(key => o[key]).filter(v => v).join(sep);
}

function filter_large_content(content, filter_rate){
    if (content == undefined){
    return content
    }
    if (content.length <= filter_rate){
        return content
    }
    else{

        filter_rate -= 1
        filter_index = filter_rate
        for (var i = 0; i < content.substring(filter_rate,).length; i++) {
            if (content.substring(i, i+1) == ' '){
                return content.substring(0, filter_index) + "... [see the full content in the report]"
            }
            else {
                filter_index += 1
            }
        }
        return content
    }
}




  function show_crawler(res) {
    res = JSON.parse(res);
    // var HTMLData = "";
    // var host;
    // var category;
    // var html_categories;
    // var description;
    // var html_description;
    // var open_ports;
    // var html_open_ports;
    // var scan_methods;
    // var html_scan_methods;
    var j;
    var k;

    var HTMLData = "";
    var target;
    var module_name;
    var target_event;
    var options;
    var date;
    var html_options;
    var html_target_event;
    var html_module_name;
    var html_date;



    for (i = 0; i < res.length; i++) {
      console.log(res[i])
      target = res[i]["target"];
      //target_event = res[i]["info"]["event"];
      options = res[i]["info"]["options"];
      //date = res[i]["info"]["date"];
      module_name = res[i]["info"]["module_name"]
      events = res[i]["info"]["event"]

      // open_ports = res[i]["info"]["open_ports"];
      // scan_methods = res[i]["info"]["scan_methods"];
      // category = res[i]["info"]["category"];

      // html_categories = "";
      // html_scan_methods = "";
      // html_open_ports = "";
      // html_description = "";
      html_target_event = "";
      html_options = "";
      html_date = "";
      html_module_name = "";

      // for (j = 0; j < open_ports.length; j++) {
      //   html_open_ports +=
      //     "<p class='mb-1 bold label label-warning'>open_port:" +
      //     open_ports[j] +
      //     "</p> ";
      //   if (j == 10) {
      //     html_open_ports +=
      //       "<p class='mb-1 bold label label-warning'>open_port: click to see more.</p> ";
      //     break;
      //   }
      // }
      // for (j = 0; j < category.length; j++) {
      //   html_categories +=
      //     "<p class='mb-1 bold label label-info'>category:" +
      //     category[j] +
      //     "</p> ";
      //   if (j == 10) {
      //     html_categories +=
      //       "<p class='mb-1 bold label label-info'>category: click to see more.</p> ";
      //     break;
      //   }
      // }
      for (j = 0; j < module_name.length; j++) {
          html_module_name +=
            "<p class='mb-1 bold label label-info'>selected_modules:" +
            module_name[j] +
            "</p> ";
        }
        html_module_name += "<br><br>"
       for (j = 0; j < events.length; j++) {
          event = events[j].split('conditions: ')[0]
          results = events[j].split('conditions: ')[1]
          html_module_name +=   "<p class='mb-1 bold label label-success'>event: " + filter_large_content(event, 100) + "</p> ";
          html_module_name += "<p class='mb-1 bold label label-warning'>condition_results: " + filter_large_content(results, 100) + "</p> <br><br>";
        }


      // html_scan_methods = "";
      // for (j = 0; j < scan_methods.length; j++) {
      //   html_scan_methods +=
      //     "<p class='mb-1 bold label label-primary'>selected_modules:" +
      //     scan_methods[j] +
      //     "</p> ";
      //   if (j == 10) {
      //     html_scan_methods +=
      //       "<p class='mb-1 bold label label-primary'>selected_modules: click to see more.</p> ";
      //     break;
      //   }
      // }
      //console.log(options)
//   crawl_results
      // for (j = 0; j < target_event.length; j++) {
      //   html_target_event +=
      //     "<p class='mb-1 bold label label-primary'>event:" +
      //     target_event[j] +
      //     "</p> ";
      //   if (j == 10) {
      //     html_target_event +=
      //       "<p class='mb-1 bold label label-primary'>event list</p> ";
      //     break;
      //   }
      // }

      // for (j = 0; j < description.length; j++) {
      //   html_description +=
      //     "<p class='mb-1 bold label label-success'>description:" +
      //     description[j] +
      //     "</p> ";
      //   if (j == 10) {
      //     html_description +=
      //       "<p class='mb-1 bold label label-success'>description: click to see more.</p> ";
      //     break;
      //   }
      // }

      HTMLData +=
        '<div class="row myBox" ><div class="d-flex w-100 text-justify justify-content-between">\n' +
        '<button class="btn btn-primary" style="margin-right: 1rem"> <a target=\'_blank\' style="color: white" href="/logs/get_html?target=' +
        target +
        '">' +
        target +
        '</a></button></span><button class="btn btn-btn-secondary" style="margin-right: 1rem"><a href="/logs/get_json?target=' +
        target +
        '">Get JSON</a></button>' +
        '<button class="btn btn-btn-secondary"><a href="/logs/get_csv?target=' +
        target +
        '">Get CSV </a></button></h3>\n' +
        "</div>\n" +
        '<p class="mb-1"> ' +
        html_options +
        html_target_event +
        html_module_name +
        html_date +
        // html_categories +
        // html_scan_methods +
        // html_open_ports +
        // html_description +
        "</p></div>";
    }

    if (res["msg"] == "No more search results") {
      HTMLData = '<p class="mb-1"> No more results to show!!</p>';
    }

    document.getElementById("crawl_results").innerHTML = HTMLData;
  }

  function clearPaginationButtons() {
    $(".page_number_btn").remove();
  }

  function updatePaginationControls(totalPages, currentPage) {
    clearPaginationButtons();

    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(startPage + 4, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = $("<button>").addClass("page_number_btn").text(i);
      if (i === currentPage) {
        pageBtn.addClass("active");
      }
      pageBtn.insertBefore("#crw_next_btn");
      pageBtn.click(function () {
        crawler_page = i;
        get_crawler_list(i);
      });
    }
    $("#crw_first_btn").toggle(currentPage > 1);
    $("#crw_previous_btn").toggle(currentPage > 1);

    $("#crw_next_btn").toggle(currentPage < totalPages);
    $("#crw_last_btn").toggle(currentPage < totalPages);

    $("#crw_previous_btn").toggle(currentPage > 1);
    $("#crw_next_btn").toggle(currentPage < totalPages);
  }
  $("#crw_first_btn").click(function () {
    if (crawler_page > 1) {
      crawler_page = 1;
      get_crawler_list(crawler_page);
    }
  });

  $("#crw_last_btn").click(function () {
    if (crawler_page < totalPages) {
      crawler_page = totalPages;
      get_crawler_list(crawler_page);
    }
  });

  function get_crawler_list(crawler_page) {
    $.ajax({
      type: "GET",
      url:
        "/logs/search?q=" + $("#search_data").val() + "&page=" + crawler_page,
      dataType: "text",
    })
    .done(function (res) {
      const totalPages = Math.ceil(res.length / 10);
      $("#login_first").addClass("hidden");
      $("#crawl_results").removeClass("hidden");
      $("#crw_refresh_btn").removeClass("hidden");
      $("#crw_nxt_prv_btn").removeClass("hidden");
      $("#current_page_number").text(crawler_page);
      $("#total_pages").text(totalPages);
      show_crawler(res);
      updatePaginationControls(totalPages, crawler_page);
  
      if (crawler_page === 1) {
        $("#crw_previous_btn").hide();
      } else {
        $("#crw_previous_btn").show();
      }
  
      if (crawler_page === totalPages) {
        $("#crw_next_btn").hide();
      } else {
        $("#crw_next_btn").show();
      }
    })
      .fail(function (jqXHR, textStatus, errorThrown) {
        if (errorThrown == "UNAUTHORIZED") {
          $("#login_first").removeClass("hidden");
          $("#crawl_results").addClass("hidden");
          $("#crw_refresh_btn").addClass("hidden");
          $("#crw_nxt_prv_btn").addClass("hidden");
          $("#home").addClass("hidden");
          $("#crawler_area").addClass("hidden");
          $("#compare_area").addClass("hidden");
        } else {
          $("#login_first").addClass("hidden");
          $("#crawl_results").removeClass("hidden");
          $("#crw_refresh_btn").removeClass("hidden");
          $("#crw_nxt_prv_btn").removeClass("hidden");
        }
      });
  }

  $("#crawler_btn").click(function () {
    crawler_page = 1;
    get_crawler_list(crawler_page);
  });

  $("#crw_refresh_btn_update").click(function () {
    crawler_page = 1;
    get_crawler_list(crawler_page);
  });

  $("#crw_refresh_btn_page").click(function () {
    get_crawler_list(crawler_page);
  });

  $("#crw_previous_btn").click(function () {
    crawler_page = crawler_page - 1;
    if (crawler_page == 1) {
      $("#crw_previous_btn").hide();
    }
    if (crawler_page == 2) {
      $("#crw_previous_btn").show();
    }
    get_crawler_list(crawler_page);
  });

  $("#crw_next_btn").click(function () {
    crawler_page = crawler_page + 1;
    if (crawler_page == 1) {
      $("#crw_previous_btn").hide();
    }
    if (crawler_page == 2) {
      $("#crw_previous_btn").show();
    }
    get_crawler_list(crawler_page);
  });

  function _query_search() {
    $.ajax({
      type: "GET",
      url: "/logs/search?q=" + $("#search_data").val(),
      dataType: "text",
    })
      .done(function (res) {
        $("#login_first").addClass("hidden");
        $("#crawl_results").removeClass("hidden");
        $("#crw_refresh_btn").removeClass("hidden");
        $("#crw_nxt_prv_btn").removeClass("hidden");
        show_crawler(res);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        if (errorThrown == "UNAUTHORIZED") {
          $("#login_first").removeClass("hidden");
          $("#crawl_results").addClass("hidden");
          $("#crw_refresh_btn").addClass("hidden");
          $("#crw_nxt_prv_btn").addClass("hidden");
          $("#home").addClass("hidden");
          $("#crawler_area").addClass("hidden");
          $("#compare_area").addClass("hidden");
        } else {
          $("#login_first").addClass("hidden");
          $("#crawl_results").removeClass("hidden");
          $("#crw_refresh_btn").removeClass("hidden");
          $("#crw_nxt_prv_btn").removeClass("hidden");
        }
      });
  }

  $("#search_btn").click(function () {
    _query_search();
  });

  $("#search_data").keyup(function (event) {
    if (event.keyCode === 13) {
      _query_search();
    }
  });

  // Real-time scan progress monitoring
  function applyScanProgressUpdate(res, startTime) {
    if (!res) return;

    // Update progress bar
    var progress = parseInt(res.progress, 10);
    if (isNaN(progress)) progress = 0;
    $("#progress_percentage").text(progress);
    $("#progress_bar")
      .css("width", progress + "%")
      .attr("aria-valuenow", progress)
      .text(progress + "%");

    // Update current scanning info
    if (res.current_target) {
      $("#current_target").text(res.current_target);
    }
    if (res.current_module) {
      $("#current_module").text(res.current_module);
    }

    // Update statistics
    $("#hosts_scanned").text(res.hosts_scanned || 0);
    $("#modules_run").text(res.modules_run || 0);
    $("#open_ports").text(res.open_ports || 0);
    $("#services_found").text(res.services_found || 0);
    $("#issues_found").text(res.issues_found || 0);

    // Calculate and update elapsed time
    var now = new Date();
    var elapsed = Math.floor((now - startTime) / 1000);
    var hours = Math.floor(elapsed / 3600);
    var minutes = Math.floor((elapsed % 3600) / 60);
    var seconds = elapsed % 60;
    var timeStr =
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0");
    $("#elapsed_time").text(timeStr);

    // Update estimated remaining time
    if (progress > 0 && progress < 100) {
      var remaining = Math.floor((elapsed * (100 - progress)) / progress);
      var rh = Math.floor(remaining / 3600);
      var rm = Math.floor((remaining % 3600) / 60);
      var rs = remaining % 60;
      var remainingStr =
        String(rh).padStart(2, "0") +
        ":" +
        String(rm).padStart(2, "0") +
        ":" +
        String(rs).padStart(2, "0");
      $("#remaining_time").text(remainingStr);
    } else if (progress >= 100) {
      $("#remaining_time").text("00:00:00");
    }

    // Update scan status
    if (res.status === "completed") {
      // If the backend reports completion but the computed percent is low,
      // force the UI to 100% to avoid a "stuck" progress bar.
      if (progress < 100) {
        progress = 100;
        $("#progress_percentage").text(progress);
        $("#progress_bar")
          .css("width", progress + "%")
          .attr("aria-valuenow", progress)
          .text(progress + "%");
        $("#remaining_time").text("00:00:00");
      }
      $("#scan_status")
        .removeClass("label-info")
        .addClass("label-success")
        .text("COMPLETED");
      $("#stop_scan_btn").prop("disabled", true);
      addLogEntry("Scan completed successfully!", "success");
      // Close any active WebSocket
      if (window.currentScanWebSocket) {
        try {
          window.currentScanWebSocket.close();
        } catch (e) {}
        window.currentScanWebSocket = null;
      }
      // Stop polling if it was running
      if (window.currentScanInterval) {
        clearInterval(window.currentScanInterval);
        window.currentScanInterval = null;
      }
    } else if (res.status === "failed") {
      $("#scan_status")
        .removeClass("label-info")
        .addClass("label-danger")
        .text("FAILED");
      $("#stop_scan_btn").prop("disabled", true);
      if (window.currentScanWebSocket) {
        try {
          window.currentScanWebSocket.close();
        } catch (e) {}
        window.currentScanWebSocket = null;
      }
      if (window.currentScanInterval) {
        clearInterval(window.currentScanInterval);
        window.currentScanInterval = null;
      }
      addLogEntry("Scan failed!", "error");
    } else if (res.status === "stopped") {
      $("#scan_status")
        .removeClass("label-info")
        .addClass("label-warning")
        .text("STOPPED");
      $("#stop_scan_btn").prop("disabled", true);
      if (window.currentScanWebSocket) {
        try {
          window.currentScanWebSocket.close();
        } catch (e) {}
        window.currentScanWebSocket = null;
      }
      if (window.currentScanInterval) {
        clearInterval(window.currentScanInterval);
        window.currentScanInterval = null;
      }
    }

    // Add new log entries
    if (res.recent_events && res.recent_events.length > 0) {
      res.recent_events.forEach(function (event) {
        var key = (event.timestamp || "") + "|" + (event.message || "");
        if (!window.seenEventKeys) window.seenEventKeys = {};
        if (!window.seenEventKeys[key]) {
          addLogEntry(event.message || key, "info");
          window.seenEventKeys[key] = true;
        }
      });
    }
  }

  function startLiveScanMonitoring(scanId, startTime) {
    // Clean up previous monitoring
    if (window.currentScanInterval) {
      clearInterval(window.currentScanInterval);
      window.currentScanInterval = null;
    }
    if (window.currentScanWebSocket) {
      try {
        window.currentScanWebSocket.close();
      } catch (e) {}
      window.currentScanWebSocket = null;
    }

    function startPollingFallback() {
      updateScanProgress(scanId, startTime);
      window.currentScanInterval = setInterval(function () {
        updateScanProgress(scanId, startTime);
      }, 2000);
    }

    // Prefer WebSocket (push updates) if supported.
    if (window.WebSocket) {
      try {
        var protocol = window.location.protocol === "https:" ? "wss" : "ws";
        var wsUrl =
          protocol +
          "://" +
          window.location.host +
          "/ws/scan?scan_id=" +
          encodeURIComponent(scanId);
        var ws = new WebSocket(wsUrl);
        window.currentScanWebSocket = ws;

        ws.onopen = function () {
          addLogEntry("Live updates connected.", "info");
        };

        ws.onmessage = function (evt) {
          try {
            var payload = JSON.parse(evt.data);
            applyScanProgressUpdate(payload, startTime);
          } catch (e) {
            // Ignore malformed events
          }
        };

        ws.onerror = function () {
          // If WS fails, fall back to polling
          if (window.currentScanWebSocket === ws) {
            window.currentScanWebSocket = null;
          }
          startPollingFallback();
        };

        ws.onclose = function () {
          // If WS closes before scan ends, fall back to polling
          if (window.currentScanWebSocket === ws) {
            window.currentScanWebSocket = null;
          }
          // If scan is still running, continue via polling
          if ($("#scan_status").text() === "RUNNING") {
            startPollingFallback();
          }
        };

        return;
      } catch (e) {
        // fall through to polling
      }
    }

    startPollingFallback();
  }

  function updateScanProgress(scanId, startTime) {
    $.ajax({
      type: "GET",
      url: "/scan/status?scan_id=" + scanId,
      dataType: "json",
    })
      .done(function (res) {
        applyScanProgressUpdate(res, startTime);
      })
      .fail(function () {
        // Scan may not have status endpoint, silently continue
      });
  }

  function addLogEntry(message, type) {
    type = type || "info";
    var timestamp = new Date().toLocaleTimeString();
    var logClass = "log-" + type;
    var logEntry = '<div class="log-entry ' + logClass + '">[' + timestamp + '] ' + message + '</div>';
    
    var logDiv = $("#live_log");
    logDiv.append(logEntry);
    logDiv.scrollTop(logDiv[0].scrollHeight);
  }

  // Stop scan button
  $("#stop_scan_btn").click(function () {
    if (window.currentScanInterval) {
      clearInterval(window.currentScanInterval);
      var scanId = $("#scan_id_display").text();
      $.ajax({
        type: "POST",
        url: "/scan/stop?scan_id=" + scanId,
        dataType: "json",
      })
        .done(function () {
          addLogEntry("Scan stopped by user.", "warning");
          $("#scan_status").text("STOPPED").removeClass("label-info").addClass("label-warning");
        });
    }
  });

  // Hide progress button
  $("#hide_progress_btn").click(function () {
    if (window.currentScanInterval) {
      clearInterval(window.currentScanInterval);
    }
    $("#current_scans_btn").click();
  });

  // Show progress on page load with poll
  window.lastLogEntry = null;
  window.currentScanInterval = null;
});


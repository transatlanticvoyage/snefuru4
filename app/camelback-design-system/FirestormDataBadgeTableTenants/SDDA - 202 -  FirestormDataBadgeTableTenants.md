BEGIN FILE
———————————————————————

What is an FK Data Badge Table?

An fk data badge table is a ui table grid that is designed to take up a small amount of space on the screen.

Its purpose is to represent situations where the user must see a db column name and value that is a foreign key field and then also see related fields from the same db row that the fk is referencing




———————————————————————
DEFINITIONS:

fk anchor field - refers to the 


th.cell_inner_wrapper_div



width of <th> cell
height of <th> cell

———————————————————————
every cell in the ui table (whether <th> or <td>) should contain an inner wrapper that occurs immediately inside the beginning of the <td> or <th> element.

this div must have the class of:
cell_inner_wrapper_div

this way i can style it like:
th.cell_inner_wrapper_div , td.cell_inner_wrapper_div , etc.


———————————————————————
.firestorm_tub_div
.firestorm_table

———————————————————————
ADDITIONAL CLASS FOR EACH INSTANCE OF THE PARENT DIV AND TABLE ELEMENT ITSELF

.firestorm_instance_2036


———————————————————————
OTHER RANDOM INFO

we must make a row like this:
shenfur_th_cells_db_table_row.css
firestorm_fk_data_badge.css